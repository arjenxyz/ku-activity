'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FiLoader } from 'react-icons/fi';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
  /** true iken kamera durur (başarılı okutma sonrası) */
  paused?: boolean;
  parseQr: (raw: string) => string | null;
  invalidQrMessage?: string;
  className?: string;
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

async function waitForElement(id: string, attempts = 80): Promise<HTMLElement> {
  for (let i = 0; i < attempts; i += 1) {
    const el = document.getElementById(id);
    if (el && el.clientWidth > 0 && el.clientHeight > 0) return el;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  const el = document.getElementById(id);
  if (!el) throw new Error('Kamera alanı hazırlanamadı.');
  if (el.clientWidth === 0 || el.clientHeight === 0) {
    el.style.minHeight = `${Math.max(window.innerHeight * 0.5, 320)}px`;
  }
  return el;
}

function buildScanConfig(desktop: boolean) {
  if (desktop) {
    return {
      fps: 12,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
        width: Math.floor(viewfinderWidth * 0.85),
        height: Math.floor(viewfinderHeight * 0.85),
      }),
      disableFlip: false,
    };
  }
  return {
    fps: 10,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      const edge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.max(200, Math.floor(edge * 0.68));
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
  return { ...camera, width: { ideal: 1280 }, height: { ideal: 720 } };
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
      for (const cam of sorted) configs.push(cam.id);
    }
  } catch {
    /* facingMode fallback */
  }

  if (desktop) {
    configs.push({ facingMode: 'user' }, { facingMode: 'environment' });
  } else {
    configs.push({ facingMode: 'environment' }, { facingMode: 'user' });
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
    return 'Kamera izni gerekli. Ayarlardan veya adres çubuğundan izin verin.';
  }
  if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
    return 'Kamera bulunamadı.';
  }
  if (msg.includes('secure') || msg.includes('SecureContext')) {
    return 'Kamera yalnızca güvenli bağlantıda (HTTPS) çalışır.';
  }
  return 'Kamera açılamadı. Kod gir ile deneyin.';
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
  invalidQrMessage = 'Geçerli bir yoklama QR kodu değil.',
  className = '',
}: Props) {
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
          throw new Error('Tarayıcınız kamera erişimini desteklemiyor.');
        }
        if (!window.isSecureContext) {
          throw new Error('Kamera yalnızca HTTPS üzerinde çalışır.');
        }

        await waitForElement(regionId);
        if (cancelled) return;

        if (scannerRef.current) await releaseScanner();
        if (cancelled) return;

        const scanner = new Html5Qrcode(regionId, {
          verbose: false,
          // TWA / mobil WebView'da BarcodeDetector takılma yapabiliyor
          useBarCodeDetectorIfSupported: false,
        });
        scannerRef.current = scanner;

        const scanConfig = buildScanConfig(desktop);
        const onDecode = (decoded: string) => {
          if (decodedRef.current) return;
          const code = parseQrRef.current(decoded);
          if (!code) {
            setError(invalidQrMessage);
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
            setActive(true);
            return;
          } catch (e) {
            lastError = e instanceof Error ? e : new Error('Kamera açılamadı');
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
          setError(mapCameraError(lastError?.message ?? 'Kamera açılamadı'));
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Kamera açılamadı';
        setError(mapCameraError(msg));
      } finally {
        if (!cancelled) setStarting(false);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      setStarting(false);
    };
  }, [disabled, paused, regionId, invalidQrMessage, releaseScanner]);

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
          <p className="text-sm text-white/75">Kamera açılıyor…</p>
        </div>
      )}

      {error && !paused && (
        <div className="absolute inset-x-4 top-4 z-[4] rounded-xl bg-red-950/90 px-4 py-2.5 text-center text-sm text-red-100 backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  );
}
