'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FiCamera, FiX } from 'react-icons/fi';
import { Html5Qrcode } from 'html5-qrcode';
import { parseRegistrationCodeFromQr } from '@/lib/parse-registration-qr';

type Props = {
  onScan: (code: string) => void;
  disabled?: boolean;
};

export function QrCameraScanner({ onScan, disabled }: Props) {
  const regionId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
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
  }, []);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  const start = async () => {
    setError(null);
    await stop();

    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          const code = parseRegistrationCodeFromQr(decoded);
          if (!code) return;
          void stop();
          onScan(code);
        },
        () => {
          /* karede QR yok — sessiz */
        }
      );
      setActive(true);
    } catch (e) {
      scannerRef.current = null;
      const msg = e instanceof Error ? e.message : 'Kamera açılamadı';
      setError(
        msg.includes('NotAllowed') || msg.includes('Permission')
          ? 'Kamera izni verilmedi. Tarayıcı ayarlarından izin verin.'
          : msg.includes('NotFound')
            ? 'Kamera bulunamadı.'
            : msg
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void start()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium disabled:opacity-50"
          >
            <FiCamera className="w-4 h-4" />
            Kamera ile QR Tara
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
        className={`overflow-hidden rounded-xl bg-black ${active ? 'min-h-[260px]' : 'hidden'}`}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {active && (
        <p className="text-xs text-slate-500">Personelin ekrandaki QR kodunu çerçeveye hizalayın.</p>
      )}
    </div>
  );
}
