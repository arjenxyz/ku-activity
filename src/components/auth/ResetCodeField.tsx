'use client';

import { useEffect, useState } from 'react';
import { inputClass } from '@/components/auth/authStyles';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  buildCameraConstraint,
  buildScanConfig,
  createQrScanner,
  enhanceRunningCamera,
  isLikelyDesktop,
  pickCameraConfigs,
} from '@/lib/qr-scanner';

export function ResetCodeField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const scanner = createQrScanner('reset-qr-reader');
    let stopped = false;

    const stop = async () => {
      if (stopped) return;
      stopped = true;
      try {
        if (scanner.isScanning) await scanner.stop();
      } catch {
        /* already stopped */
      }
      try {
        scanner.clear();
      } catch {
        /* ignore */
      }
    };

    void (async () => {
      const desktop = isLikelyDesktop();
      const configs = await pickCameraConfigs();
      for (const camera of configs) {
        if (stopped) return;
        try {
          await scanner.start(
            buildCameraConstraint(camera, desktop),
            buildScanConfig(desktop, 'embedded'),
            (text) => {
              onChange(text.trim());
              setOpen(false);
            },
            () => undefined
          );
          await enhanceRunningCamera(scanner);
          setScanError(null);
          return;
        } catch {
          /* sonraki kamerayı dene */
        }
      }
      if (!stopped) setScanError('Kamera açılamadı');
    })();

    return () => {
      void stop();
    };
  }, [open, onChange]);

  return (
    <>
      <div className="relative">
        <input
          id={id}
          required
          className={`${inputClass} pr-12`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="QR içindeki kod"
          autoComplete="one-time-code"
        />
        <button
          type="button"
          className="absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded-lg text-[#0E1548] hover:bg-slate-50"
          aria-label="QR okut"
          onClick={() => {
            setScanError(null);
            setOpen(true);
          }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8" strokeLinecap="round" />
            <path d="M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8" strokeLinecap="round" />
            <path d="M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16" strokeLinecap="round" />
            <path d="M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" strokeLinecap="round" />
            <path d="M7 12h10" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-md">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-4 shadow-2xl" data-scroll-lock-allow="">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0E1548]">QR okut</p>
              <button type="button" className="text-sm text-slate-500" onClick={() => setOpen(false)}>
                Kapat
              </button>
            </div>
            <div id="reset-qr-reader" className="overflow-hidden rounded-2xl bg-slate-900" />
            {scanError ? <p className="mt-3 text-sm text-red-700">{scanError}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
