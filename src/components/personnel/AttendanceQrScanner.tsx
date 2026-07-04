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

async function waitForElement(id: string, attempts = 40): Promise<HTMLElement> {
  for (let i = 0; i < attempts; i += 1) {
    const el = document.getElementById(id);
    if (el && el.clientWidth > 0 && el.clientHeight > 0) return el;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  const el = document.getElementById(id);
  if (!el) throw new Error('Kamera alanı hazırlanamadı.');
  return el;
}

/** Tam kare tarama — kütüphanenin kendi çerçevesi gizlenir */
function buildScanConfig(viewfinderWidth: number, viewfinderHeight: number) {
  return {
    fps: 12,
    qrbox: { width: viewfinderWidth, height: viewfinderHeight },
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
  return 'Kamera açılamadı. Alttan kod girebilirsiniz.';
}

/** Tek çerçeve — box-shadow vignette, çift köşe yok */
function ScanSpotlight() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
      <div
        className="relative h-[min(58vw,240px)] w-[min(58vw,240px)] rounded-2xl border-2 border-emerald-400/75"
        style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.52)' }}
      >
        <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
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

        const mount = await waitForElement(regionId);
        if (cancelled) return;

        if (scannerRef.current) await releaseScanner();
        if (cancelled) return;

        const scanner = new Html5Qrcode(regionId, {
          verbose: false,
          useBarCodeDetectorIfSupported: !desktop,
        });
        scannerRef.current = scanner;

        const w = mount.clientWidth;
        const h = mount.clientHeight;
        const scanConfig = buildScanConfig(w, h);

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
    <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
      <div id={regionId} className="attendance-scanner absolute inset-0" />

      {active && <ScanSpotlight />}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-3">
        <p className="text-center text-sm font-medium text-white/95 drop-shadow-sm">
          QR kodu yeşil çerçevenin içine getirin
        </p>
      </div>

      {starting && !active && !error && (
        <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center gap-3 bg-black">
          <FiLoader className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-white/75">Kamera açılıyor…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-x-4 top-14 z-[4] rounded-xl bg-red-950/90 px-4 py-2.5 text-center text-sm text-red-100 backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  );
}
