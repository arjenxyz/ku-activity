'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FiCamera, FiImage, FiX } from 'react-icons/fi';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import { parseRegistrationCodeFromQr, extractVerificationCode } from '@/lib/parse-registration-qr';
import strings from '@json/src/components/registration/QrCameraScanner.json';

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
  /** Varsayılan: başvuru kodu. Yoklama için parseAttendanceTokenFromQr verin. */
  parseQr?: (raw: string) => string | null;
  invalidQrMessage?: string;
};

function isLikelyDesktop() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: fine)').matches || navigator.maxTouchPoints === 0;
}

function cameraPriority(cam: CameraDevice, desktop: boolean) {
  const label = cam.label.toLowerCase();
  if (desktop) {
    if (/front|user|face|ön|integrated|built-in|webcam|hd pro/i.test(label)) return 0;
    if (/back|rear|environment|arka|wide/i.test(label)) return 2;
    return 1;
  }
  if (/back|rear|environment|arka|wide/i.test(label)) return 0;
  if (/front|user|face|ön|integrated|built-in|webcam/i.test(label)) return 1;
  return 2;
}

async function waitForElement(id: string, attempts = 20): Promise<HTMLElement> {
  for (let i = 0; i < attempts; i += 1) {
    const el = document.getElementById(id);
    if (el && el.clientWidth > 0 && el.clientHeight > 0) return el;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  const el = document.getElementById(id);
  if (!el) throw new Error(strings.errors.elementNotReady);
  return el;
}

async function ensureCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(strings.errors.cameraNotSupported);
  }
  if (!window.isSecureContext) {
    throw new Error(strings.errors.secureContextRequired);
  }
}

function buildScanConfig(desktop: boolean) {
  if (desktop) {
    return {
      fps: 15,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
        width: Math.floor(viewfinderWidth * 0.92),
        height: Math.floor(viewfinderHeight * 0.92),
      }),
      disableFlip: false,
    };
  }

  return {
    fps: 10,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      const edge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.max(160, Math.floor(edge * 0.7));
      return { width: size, height: size };
    },
    disableFlip: false,
  };
}

function buildCameraConstraint(
  camera: string | MediaTrackConstraints,
  desktop: boolean
): string | MediaTrackConstraints {
  if (typeof camera === 'string') return camera;
  if (!desktop) return camera;
  return {
    ...camera,
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };
}

async function pickCameraConfigs(): Promise<Array<string | MediaTrackConstraints>> {
  const desktop = isLikelyDesktop();
  const configs: Array<string | MediaTrackConstraints> = [];

  try {
    const cameras = await Html5Qrcode.getCameras();
    if (cameras.length > 0) {
      const sorted = [...cameras].sort(
        (a, b) => cameraPriority(a, desktop) - cameraPriority(b, desktop)
      );
      for (const cam of sorted) {
        configs.push(cam.id);
      }
    }
  } catch {
    /* getCameras desteklenmiyorsa facingMode dene */
  }

  if (desktop) {
    configs.push({ facingMode: 'user' });
    configs.push({ facingMode: 'environment' });
  } else {
    configs.push({ facingMode: 'environment' });
    configs.push({ facingMode: 'user' });
  }

  const seen = new Set<string>();
  return configs.filter((c) => {
    const key = typeof c === 'string' ? c : JSON.stringify(c);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapCameraError(msg: string) {
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
  invalidQrMessage = strings.invalidQrDefault,
}: Props) {
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

  const handleDecoded = useCallback((decoded: string) => {
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
  }, []);

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
        ensureCameraPermission();
        await waitForElement(regionId);
        if (cancelled) return;

        if (scannerRef.current) {
          await releaseScanner();
        }
        if (cancelled) return;

        const scanner = new Html5Qrcode(regionId, {
          verbose: false,
          useBarCodeDetectorIfSupported: !desktop,
        });
        scannerRef.current = scanner;

        const scanConfig = buildScanConfig(desktop);

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
        setError(mapCameraError(msg));
      } catch (e) {
        if (cancelled) return;
        setViewfinderOpen(false);
        const msg = e instanceof Error ? e.message : strings.errors.cameraOpenFailed;
        setError(mapCameraError(msg));
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
  }, [viewfinderOpen, active, regionId, handleDecoded, releaseScanner]);

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

    const scanner = new Html5Qrcode(regionId, {
      verbose: false,
      useBarCodeDetectorIfSupported: !isLikelyDesktop(),
    });

    try {
      const decoded = await scanner.scanFile(file, false);
      if (!handleDecoded(decoded)) {
        setError(invalidQrMessage);
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
