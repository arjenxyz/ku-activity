'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiCamera, FiImage, FiX } from 'react-icons/fi';
import type { Html5Qrcode } from 'html5-qrcode';
import { parseRegistrationCodeFromQr, extractVerificationCode } from '@/lib/parse-registration-qr';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';
import {
  buildCameraConstraint,
  buildScanConfig,
  createQrScanner,
  enhanceRunningCamera,
  isLikelyDesktop,
  pickCameraConfigs,
  scanQrFromFile,
} from '@/lib/qr-scanner';

type QrScannerStrings = ReturnType<typeof getRegistryStrings<'components/registration/QrCameraScanner'>>;

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
  /** Varsayılan: başvuru kodu. Yoklama için parseAttendanceTokenFromQr verin. */
  parseQr?: (raw: string) => string | null;
  invalidQrMessage?: string;
};

async function waitForElement(id: string, strings: QrScannerStrings, attempts = 20): Promise<HTMLElement> {
  for (let i = 0; i < attempts; i += 1) {
    const el = document.getElementById(id);
    if (el && el.clientWidth > 0 && el.clientHeight > 0) return el;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  const el = document.getElementById(id);
  if (!el) throw new Error(strings.errors.elementNotReady);
  return el;
}

async function ensureCameraPermission(strings: QrScannerStrings) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(strings.errors.cameraNotSupported);
  }
  if (!window.isSecureContext) {
    throw new Error(strings.errors.secureContextRequired);
  }
}

function mapCameraError(msg: string, strings: QrScannerStrings) {
  if (msg.includes('NotAllowed') || msg.includes('Permission')) {
    return strings.errors.permissionDenied;
  }
  if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
    return strings.errors.cameraNotFound;
  }
  if (msg.includes('secure') || msg.includes('SecureContext')) {
    return strings.errors.secureContextRequired;
  }
  return strings.errors.cameraOpenFailed;
}

export function QrCameraScanner({
  onScan,
  disabled,
  parseQr,
  invalidQrMessage,
}: Props) {
  const strings = useRegistryStrings('components/registration/QrCameraScanner');
  const resolvedInvalidMessage = invalidQrMessage ?? strings.invalidQrDefault;
  const regionId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onScanRef = useRef(onScan);
  const parseQrRef = useRef(parseQr);
  const bootingRef = useRef(false);
  const stopRef = useRef<() => Promise<void>>(async () => {});
  const [viewfinderOpen, setViewfinderOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [scanningFile, setScanningFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRawScan, setLastRawScan] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    parseQrRef.current = parseQr;
  }, [parseQr]);

  const handleDecoded = useCallback(
    (decoded: string) => {
      const parser = parseQrRef.current ?? parseRegistrationCodeFromQr;
      const code = parser(decoded) ?? extractVerificationCode(decoded);
      if (!code) {
        setLastRawScan(decoded.slice(0, 120));
        setError(strings.errors.qrReadNoCode);
        return false;
      }
      setError(null);
      setLastRawScan(null);
      onScanRef.current(code);
      return true;
    },
    [strings.errors.qrReadNoCode]
  );

  const releaseScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        /* zaten durmuş */
      }
      try {
        scanner.clear();
      } catch {
        /* */
      }
    }
    setActive(false);
    setStarting(false);
  }, []);

  const stop = useCallback(async () => {
    await releaseScanner();
    setViewfinderOpen(false);
  }, [releaseScanner]);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  useEffect(() => {
    return () => {
      void releaseScanner();
    };
  }, [releaseScanner]);

  useEffect(() => {
    if (!viewfinderOpen || active || bootingRef.current) return;

    let cancelled = false;
    bootingRef.current = true;

    const boot = async () => {
      setError(null);
      setLastRawScan(null);
      setStarting(true);
      const desktop = isLikelyDesktop();

      try {
        await ensureCameraPermission(strings);
        await waitForElement(regionId, strings);
        if (cancelled) return;

        if (scannerRef.current) {
          await releaseScanner();
        }
        if (cancelled) return;

        const scanner = createQrScanner(regionId);
        scannerRef.current = scanner;

        const scanConfig = buildScanConfig(desktop, 'embedded');

        const onDecode = (decoded: string) => {
          if (handleDecoded(decoded)) {
            void stopRef.current();
          }
        };

        const cameraConfigs = await pickCameraConfigs();
        let lastError: Error | null = null;

        for (const camera of cameraConfigs) {
          if (cancelled) return;
          try {
            await scanner.start(
              buildCameraConstraint(camera, desktop),
              scanConfig,
              onDecode,
              () => {
                /* karede QR yok */
              }
            );
            if (cancelled) {
              await scanner.stop().catch(() => {});
              return;
            }
            await enhanceRunningCamera(scanner);
            setActive(true);
            return;
          } catch (e) {
            lastError = e instanceof Error ? e : new Error(strings.errors.cameraOpenFailed);
            try {
              await scanner.stop();
            } catch {
              /* */
            }
          }
        }

        scannerRef.current = null;
        try {
          scanner.clear();
        } catch {
          /* */
        }
        setViewfinderOpen(false);

        const msg = lastError?.message ?? strings.errors.cameraOpenFailed;
        setError(mapCameraError(msg, strings));
      } catch (e) {
        if (cancelled) return;
        setViewfinderOpen(false);
        const msg = e instanceof Error ? e.message : strings.errors.cameraOpenFailed;
        setError(mapCameraError(msg, strings));
      } finally {
        bootingRef.current = false;
        if (!cancelled) setStarting(false);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      bootingRef.current = false;
    };
  }, [viewfinderOpen, active, regionId, handleDecoded, releaseScanner, strings]);

  const start = () => {
    if (disabled || starting || active) return;
    setError(null);
    setViewfinderOpen(true);
  };

  const scanFromFile = async (file: File | null) => {
    if (!file || disabled) return;
    setError(null);
    setScanningFile(true);
    await releaseScanner();
    setViewfinderOpen(false);

    const scanner = createQrScanner(regionId);

    try {
      const decoded = await scanQrFromFile(scanner, file);
      if (!handleDecoded(decoded)) {
        setError(resolvedInvalidMessage);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : strings.errors.imageScanFailed;
      setError(
        msg.includes('No QR code found') || msg.includes('NotFoundException')
          ? strings.errors.noQrInImage
          : strings.errors.imageScanFailed
      );
    } finally {
      try {
        scanner.clear();
      } catch {
        /* */
      }
      setScanningFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <>
            <button
              type="button"
              disabled={disabled || starting || scanningFile}
              onClick={start}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
            >
              <FiCamera className="w-4 h-4" />
              {starting ? strings.openingCamera : strings.scanWithCamera}
            </button>
            <button
              type="button"
              disabled={disabled || starting || scanningFile}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <FiImage className="w-4 h-4" />
              {scanningFile ? strings.scanningFile : strings.uploadQrImage}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void scanFromFile(e.target.files?.[0] ?? null)}
            />
          </>
        ) : (
          <button
            type="button"
            onClick={() => void stop()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            <FiX className="w-4 h-4" />
            {strings.stopScan}
          </button>
        )}
      </div>

      <div
        id={regionId}
        className={[
          'qr-scanner-view overflow-hidden rounded-xl border border-slate-200 bg-slate-900',
          viewfinderOpen || active ? 'min-h-[280px] max-h-[min(50vh,360px)]' : 'hidden',
        ].join(' ')}
      />

      {error && (
        <div className="space-y-1">
          <p className="text-sm text-red-600">{error}</p>
          {lastRawScan && (
            <p className="text-xs text-slate-500 break-all">
              {strings.rawScanPrefix} {lastRawScan}
            </p>
          )}
        </div>
      )}
      {starting && !active && !error && (
        <p className="text-xs text-slate-500">{strings.startingCamera}</p>
      )}
      {active && (
        <p className="text-xs text-slate-500">{strings.activeHint}</p>
      )}
      {!active && !error && (
        <p className="text-xs text-slate-500">{strings.idleHint}</p>
      )}
    </div>
  );
}
