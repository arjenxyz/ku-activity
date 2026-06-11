'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FiCamera, FiX } from 'react-icons/fi';
import { Html5Qrcode, type CameraDevice } from 'html5-qrcode';
import { parseRegistrationCodeFromQr } from '@/lib/parse-registration-qr';

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
};

function cameraPriority(cam: CameraDevice) {
  const label = cam.label.toLowerCase();
  if (/back|rear|environment|arka|wide/i.test(label)) return 0;
  if (/front|user|face|ön|integrated|built-in|webcam/i.test(label)) return 1;
  return 2;
}

async function pickCameraConfigs(): Promise<Array<string | MediaTrackConstraints>> {
  const configs: Array<string | MediaTrackConstraints> = [];

  try {
    const cameras = await Html5Qrcode.getCameras();
    if (cameras.length > 0) {
      const sorted = [...cameras].sort((a, b) => cameraPriority(a) - cameraPriority(b));
      for (const cam of sorted) {
        configs.push(cam.id);
      }
    }
  } catch {
    /* getCameras desteklenmiyorsa facingMode dene */
  }

  configs.push({ facingMode: 'user' });
  configs.push({ facingMode: 'environment' });

  const seen = new Set<string>();
  return configs.filter((c) => {
    const key = typeof c === 'string' ? c : JSON.stringify(c);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function QrCameraScanner({ onScan, disabled }: Props) {
  const regionId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
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

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  const start = async () => {
    setError(null);
    setStarting(true);
    await stop();

    const scanner = new Html5Qrcode(regionId, false);
    scannerRef.current = scanner;

    const scanConfig = {
      fps: 10,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const edge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.max(180, Math.floor(edge * 0.72));
        return { width: size, height: size };
      },
      aspectRatio: 1.0,
    };

    const onDecode = (decoded: string) => {
      const code = parseRegistrationCodeFromQr(decoded);
      if (!code) return;
      void stop();
      onScan(code);
    };

    const cameraConfigs = await pickCameraConfigs();
    let lastError: Error | null = null;

    for (const camera of cameraConfigs) {
      try {
        await scanner.start(camera, scanConfig, onDecode, () => {
          /* karede QR yok */
        });
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
    setStarting(false);

    const msg = lastError?.message ?? 'Kamera açılamadı';
    setError(
      msg.includes('NotAllowed') || msg.includes('Permission')
        ? 'Kamera izni verilmedi. Tarayıcı adres çubuğundaki kamera ikonundan izin verin.'
        : msg.includes('NotFound')
          ? 'Kamera bulunamadı. USB/webcam bağlı mı kontrol edin.'
          : 'Kamera açılamadı. Farklı tarayıcı deneyin veya başvuru kodunu elle girin.'
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <button
            type="button"
            disabled={disabled || starting}
            onClick={() => void start()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
          >
            <FiCamera className="w-4 h-4" />
            {starting ? 'Kamera açılıyor…' : 'Kamera ile QR Tara'}
          </button>
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
          active || starting ? 'min-h-[280px] max-h-[min(50vh,360px)]' : 'hidden',
        ].join(' ')}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {active && (
        <p className="text-xs text-slate-500">
          Personelin telefonundaki QR kodunu kameraya gösterin. PC&apos;de ön kamera (webcam)
          kullanılır — telefonu ekrana yaklaştırın.
        </p>
      )}
    </div>
  );
}
