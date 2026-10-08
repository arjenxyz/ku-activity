'use client';

import { useEffect, useState } from 'react';
import { inputClass } from '@/components/auth/authStyles';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  buildCameraConstraint,
  buildScanConfig,
  createQrScanner,
  enhanceRunningCamera,
  pickCameraConfigs,
} from '@/lib/qr-scanner';

function isDesktopComputer() {
  if (typeof window === 'undefined') return false;
  const touch = navigator.maxTouchPoints > 0;
  const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  return fineHover && !touch;
}

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
  const [desktopBlocked, setDesktopBlocked] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || desktopBlocked) return;
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
      const configs = await pickCameraConfigs();
      for (const camera of configs) {
        if (stopped) return;
        try {
          await scanner.start(
            buildCameraConstraint(camera, false),
            buildScanConfig(false, 'fullscreen'),
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
  }, [open, desktopBlocked, onChange]);

  return (
    <>
      <div className="relative">
        <input
          id={id}
          required
          className={`${inputClass} pr-12`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="KU-1A2B"
          autoComplete="one-time-code"
        />
        <button
          type="button"
          className="absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded-lg text-[#0E1548] hover:bg-slate-50"
          aria-label="QR okut"
          onClick={() => {
            setScanError(null);
            setDesktopBlocked(isDesktopComputer());
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

      {open && desktopBlocked ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 px-6 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <p className="text-base font-semibold text-[#0E1548]">Masaüstünde desteklenmemektir</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              QR okutmak için telefon veya tablet kullan.
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-2xl bg-[#0E1548] px-4 py-3 text-sm font-medium text-white"
              onClick={() => setOpen(false)}
            >
              Kapat
            </button>
          </div>
        </div>
      ) : null}

      {open && !desktopBlocked ? (
        <div className="fixed inset-0 z-[100] bg-black text-white">
          <div id="reset-qr-reader" className="attendance-scanner" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-64 w-64">
              <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-white" />
              <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-white" />
              <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-white" />
              <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-white" />
            </div>
          </div>
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
            <p className="text-base font-semibold">QR okut</p>
            <button
              type="button"
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur"
              onClick={() => setOpen(false)}
            >
              Kapat
            </button>
          </div>
          <p className="absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] px-8 text-center text-sm text-white/90">
            Yönetici kodunu çerçevenin içine getir.
          </p>
          {scanError ? (
            <p className="absolute inset-x-6 top-24 rounded-2xl bg-white px-4 py-3 text-center text-sm text-red-700">
              {scanError}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
