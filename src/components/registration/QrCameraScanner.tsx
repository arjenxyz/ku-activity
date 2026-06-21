'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FiCamera, FiImage, FiX } from 'react-icons/fi';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import { parseRegistrationCodeFromQr } from '@/lib/parse-registration-qr';

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
  if (!el) throw new Error('Kamera alanı hazırlanamadı. Sayfayı yenileyip tekrar deneyin.');
  return el;
}

async function ensureCameraPermission() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Tarayıcınız kamera erişimini desteklemiyor.');
  }
  if (!window.isSecureContext) {
    throw new Error('Kamera yalnızca HTTPS veya localhost üzerinde çalışır.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  stream.getTracks().forEach((track) => track.stop());
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
    return 'Kamera izni verilmedi. Tarayıcı adres çubuğundaki kamera ikonundan izin verin.';
  }
  if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
    return 'Kamera bulunamadı. USB/webcam bağlı mı kontrol edin.';
  }
  if (msg.includes('secure') || msg.includes('SecureContext')) {
    return 'Kamera yalnızca HTTPS veya localhost üzerinde çalışır.';
  }
  return 'Kamera açılamadı. Farklı tarayıcı deneyin, QR görseli yükleyin veya kodu elle girin.';
}

export function QrCameraScanner({
  onScan,
  disabled,
  parseQr,
  invalidQrMessage = 'Görselde geçerli başvuru QR kodu bulunamadı.',
}: Props) {
  const regionId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewfinderOpen, setViewfinderOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [scanningFile, setScanningFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecoded = useCallback(
    (decoded: string) => {
      const parser = parseQr ?? parseRegistrationCodeFromQr;
      const code = parser(decoded);
      if (!code) return false;
      onScan(code);
      return true;
    },
    [onScan, parseQr]
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
    return () => {
      void releaseScanner();
    };
  }, [releaseScanner]);

  useEffect(() => {
    if (!viewfinderOpen || active) return;

    let cancelled = false;

    const boot = async () => {
      setError(null);
      setStarting(true);

      try {
        await ensureCameraPermission();
        await waitForElement(regionId);
        if (cancelled) return;

        await releaseScanner();
        if (cancelled) return;

        const scanner = new Html5Qrcode(regionId, {
          verbose: false,
          useBarCodeDetectorIfSupported: true,
        });
        scannerRef.current = scanner;

        const scanConfig = {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(160, Math.floor(edge * 0.7));
            return { width: size, height: size };
          },
          disableFlip: false,
        };

        const onDecode = (decoded: string) => {
          if (handleDecoded(decoded)) {
            void stop();
          }
        };

        const cameraConfigs = await pickCameraConfigs();
        let lastError: Error | null = null;

        for (const camera of cameraConfigs) {
          if (cancelled) return;
          try {
            await scanner.start(camera, scanConfig, onDecode, () => {
              /* karede QR yok */
            });
            if (cancelled) {
              await scanner.stop().catch(() => {});
              return;
            }
            setActive(true);
            setStarting(false);
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
        setStarting(false);
        setViewfinderOpen(false);

        const msg = lastError?.message ?? 'Kamera açılamadı';
        setError(mapCameraError(msg));
      } catch (e) {
        if (cancelled) return;
        setStarting(false);
        setViewfinderOpen(false);
        const msg = e instanceof Error ? e.message : 'Kamera açılamadı';
        setError(mapCameraError(msg));
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [viewfinderOpen, active, regionId, handleDecoded, releaseScanner, stop]);

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
      useBarCodeDetectorIfSupported: true,
    });

    try {
      const decoded = await scanner.scanFile(file, false);
      if (!handleDecoded(decoded)) {
        setError(invalidQrMessage);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'QR okunamadı';
      setError(
        msg.includes('No QR code found') || msg.includes('NotFoundException')
          ? 'Görselde QR kodu bulunamadı. Daha net bir ekran görüntüsü deneyin.'
          : 'QR görseli okunamadı. Başvuru kodunu elle girebilirsiniz.'
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
              {starting ? 'Kamera açılıyor…' : 'Kamera ile QR Tara'}
            </button>
            <button
              type="button"
              disabled={disabled || starting || scanningFile}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <FiImage className="w-4 h-4" />
              {scanningFile ? 'Okunuyor…' : 'QR Görseli Yükle'}
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
            Taramayı Durdur
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {active && (
        <p className="text-xs text-slate-500">
          Personelin telefonundaki QR kodunu web kameranıza gösterin. PC&apos;de telefonu ekrana
          yaklaştırın; okumazsa ekran görüntüsünü &quot;QR Görseli Yükle&quot; ile seçin.
        </p>
      )}
      {!active && !error && (
        <p className="text-xs text-slate-500">
          PC&apos;de kamera açılmazsa QR ekran görüntüsünü yükleyin veya başvuru kodunu elle girin.
        </p>
      )}
    </div>
  );
}
