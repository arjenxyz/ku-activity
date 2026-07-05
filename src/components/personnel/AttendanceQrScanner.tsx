'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiLoader } from 'react-icons/fi';
import type { Html5Qrcode } from 'html5-qrcode';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';
import {
  buildCameraConstraint,
  buildScanConfig,
  createQrScanner,
  enhanceRunningCamera,
  isLikelyDesktop,
  pickCameraConfigs,
} from '@/lib/qr-scanner';

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
  /** true iken kamera durur (başarılı okutma sonrası) */
  paused?: boolean;
  parseQr: (raw: string) => string | null;
  invalidQrMessage?: string;
  className?: string;
};

async function waitForElement(id: string, regionNotReady: string, attempts = 80): Promise<HTMLElement> {
  for (let i = 0; i < attempts; i += 1) {
    const el = document.getElementById(id);
    if (el && el.clientWidth > 0 && el.clientHeight > 0) return el;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  const el = document.getElementById(id);
  if (!el) throw new Error(regionNotReady);
  if (el.clientWidth === 0 || el.clientHeight === 0) {
    el.style.minHeight = `${Math.max(window.innerHeight * 0.5, 320)}px`;
  }
  return el;
}

function mapCameraError(msg: string, strings: ReturnType<typeof getRegistryStrings<'components/personnel/AttendanceQrScanner'>>) {
  if (msg.includes('NotAllowed') || msg.includes('Permission')) {
    return strings.errors.permissionDenied;
  }
  if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
    return strings.errors.notFound;
  }
  if (msg.includes('secure') || msg.includes('SecureContext')) {
    return strings.errors.secureContext;
  }
  return strings.errors.openFailed;
}

function ScanSpotlight() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
      <div
        className="relative h-[min(58vw,240px)] w-[min(58vw,240px)] rounded-2xl border-2 border-emerald-400/80"
        style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}
      />
    </div>
  );
}

export function AttendanceQrScanner({
  onScan,
  disabled,
  paused = false,
  parseQr,
  invalidQrMessage,
  className = '',
}: Props) {
  const strings = useRegistryStrings('components/personnel/AttendanceQrScanner');
  const resolvedInvalidMessage = invalidQrMessage ?? strings.invalidQrMessage;
  const regionId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const parseQrRef = useRef(parseQr);
  const decodedRef = useRef(false);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    parseQrRef.current = parseQr;
  }, [parseQr]);

  const releaseScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        /* */
      }
      try {
        scanner.clear();
      } catch {
        /* */
      }
    }
    setActive(false);
  }, []);

  useEffect(() => {
    return () => {
      void releaseScanner();
    };
  }, [releaseScanner]);

  useEffect(() => {
    if (!paused) decodedRef.current = false;
  }, [paused]);

  useEffect(() => {
    if (disabled || paused) {
      void releaseScanner();
      setStarting(false);
      return;
    }

    let cancelled = false;
    setStarting(true);
    setError(null);

    const boot = async () => {
      const desktop = isLikelyDesktop();

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(strings.errors.unsupported);
        }
        if (!window.isSecureContext) {
          throw new Error(strings.errors.httpsRequired);
        }

        await waitForElement(regionId, strings.errors.regionNotReady);
        if (cancelled) return;

        if (scannerRef.current) await releaseScanner();
        if (cancelled) return;

        const scanner = createQrScanner(regionId);
        scannerRef.current = scanner;

        const scanConfig = buildScanConfig(desktop, 'fullscreen');
        const onDecode = (decoded: string) => {
          if (decodedRef.current) return;
          const code = parseQrRef.current(decoded);
          if (!code) {
            setError(resolvedInvalidMessage);
            return;
          }
          decodedRef.current = true;
          setError(null);
          void releaseScanner();
          onScanRef.current(code);
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
            lastError = e instanceof Error ? e : new Error(strings.errors.cameraFailed);
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

        if (!cancelled) {
          setError(mapCameraError(lastError?.message ?? strings.errors.cameraFailed, strings));
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : strings.errors.cameraFailed;
        setError(mapCameraError(msg, strings));
      } finally {
        if (!cancelled) setStarting(false);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      setStarting(false);
    };
  }, [disabled, paused, regionId, resolvedInvalidMessage, releaseScanner, strings]);

  const showLoading = starting && !active && !paused && !error;

  return (
    <div className={`relative h-full w-full overflow-hidden bg-black ${className}`}>
      <div id={regionId} className="attendance-scanner absolute inset-0 h-full w-full min-h-[50dvh]" />

      {active && !paused && <ScanSpotlight />}

      {paused && !active && (
        <div className="absolute inset-0 z-[3] bg-black" aria-hidden />
      )}

      {showLoading && (
        <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center gap-3 bg-black">
          <FiLoader className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-white/75">{strings.openingCamera}</p>
        </div>
      )}

      {error && !paused && (
        <div className="fixed inset-x-4 bottom-nav z-[8] rounded-xl bg-red-950/90 px-4 py-3 text-center text-sm text-red-100 shadow-lg backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  );
}
