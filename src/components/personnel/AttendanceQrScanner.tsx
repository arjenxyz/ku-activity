'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FiLoader } from 'react-icons/fi';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
  parseQr: (raw: string) => string | null;
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

async function waitForElement(id: string, attempts = 30): Promise<HTMLElement> {
  for (let i = 0; i < attempts; i += 1) {
    const el = document.getElementById(id);
    if (el && el.clientWidth > 0 && el.clientHeight > 0) return el;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  const el = document.getElementById(id);
  if (!el) throw new Error('Kamera alanı hazırlanamadı.');
  return el;
}

function buildScanConfig(desktop: boolean) {
  if (desktop) {
    return {
      fps: 15,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
        width: Math.floor(viewfinderWidth * 0.88),
        height: Math.floor(viewfinderHeight * 0.88),
      }),
      disableFlip: false,
    };
  }
  return {
    fps: 12,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      const edge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.max(180, Math.floor(edge * 0.72));
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
  return 'Kamera açılamadı. Kod gir seçeneğini kullanabilirsiniz.';
}

function ScanFrameOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
      <div className="relative aspect-square w-[min(72vw,280px)] max-h-[min(52vh,320px)]">
        <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-[3px] border-t-[3px] border-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.35)]" />
        <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-[3px] border-t-[3px] border-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.35)]" />
        <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-[3px] border-l-[3px] border-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.35)]" />
        <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-[3px] border-r-[3px] border-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.35)]" />
        <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />
      </div>
    </div>
  );
}

export function AttendanceQrScanner({
  onScan,
  disabled,
  parseQr,
  invalidQrMessage = 'Geçerli bir yoklama QR kodu değil.',
}: Props) {
  const regionId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const parseQrRef = useRef(parseQr);
  const bootingRef = useRef(false);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(true);
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
    if (disabled || bootingRef.current) return;

    let cancelled = false;
    bootingRef.current = true;
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
          useBarCodeDetectorIfSupported: !desktop,
        });
        scannerRef.current = scanner;

        const scanConfig = buildScanConfig(desktop);
        const onDecode = (decoded: string) => {
          const code = parseQrRef.current(decoded);
          if (!code) {
            setError(invalidQrMessage);
            return;
          }
          setError(null);
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

        setError(mapCameraError(lastError?.message ?? 'Kamera açılamadı'));
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Kamera açılamadı';
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
  }, [disabled, regionId, invalidQrMessage, releaseScanner]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/55 via-black/20 to-transparent px-4 pb-10 pt-3">
        <p className="text-center text-sm font-medium text-white/95">
          Ustanın ekranındaki QR kodu çerçeveye hizalayın
        </p>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          id={regionId}
          className="qr-scanner-view attendance-scanner absolute inset-0 overflow-hidden bg-slate-950"
        />
        {(starting || active) && <ScanFrameOverlay />}
        {starting && !active && !error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/90">
            <FiLoader className="h-8 w-8 animate-spin text-emerald-400" />
            <p className="text-sm text-white/80">Kamera açılıyor…</p>
          </div>
        )}
      </div>

      {error && (
        <div className="absolute inset-x-4 bottom-4 z-20 rounded-xl border border-red-400/30 bg-red-950/90 px-4 py-3 text-center text-sm text-red-100 backdrop-blur-sm">
          {error}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
}
