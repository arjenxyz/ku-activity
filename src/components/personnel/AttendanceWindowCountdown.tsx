'use client';

import { useEffect, useRef, useState } from 'react';
import { FiClock } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';

type Props = {
  /** Hedef anın ISO zaman damgası (açılış veya bitiş) */
  targetIso: string;
  /** Pencere açık mı — açıksa bitişe, değilse açılışa sayar */
  isOpen: boolean;
  variant?: 'overlay' | 'panel';
  /** Geri sayım sıfıra ulaştığında (durumu yenilemek için) */
  onElapsed?: () => void;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function splitRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function AttendanceWindowCountdown({
  targetIso,
  isOpen,
  variant = 'overlay',
  onElapsed,
}: Props) {
  const strings = useRegistryStrings('app/personnel-panel/yoklama/page');
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [targetIso]);

  const target = new Date(targetIso).getTime();
  const remaining = Number.isFinite(target) ? target - now : 0;

  useEffect(() => {
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true;
      onElapsed?.();
    }
  }, [remaining, onElapsed]);

  if (!Number.isFinite(target)) return null;

  const { days, hours, minutes, seconds } = splitRemaining(remaining);
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  const label = isOpen ? strings.countdown.closesLabel : strings.countdown.opensLabel;

  if (variant === 'panel') {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
          isOpen
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100'
            : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200'
        }`}
      >
        <FiClock
          className={`h-4 w-4 shrink-0 ${
            isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
          }`}
        />
        <span className="font-medium">{label}</span>
        <span className="ml-auto font-mono font-semibold tabular-nums tracking-tight">
          {days > 0 ? `${days}${strings.countdown.dayShort} ` : ''}
          {clock}
        </span>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-[6] flex justify-center px-4">
      <div
        className={`flex items-center gap-2.5 rounded-full border px-3.5 py-2 text-xs shadow-lg backdrop-blur-md ${
          isOpen
            ? 'border-emerald-300/25 bg-emerald-950/70 text-emerald-50'
            : 'border-white/10 bg-black/55 text-white/90'
        }`}
      >
        <FiClock
          className={`h-3.5 w-3.5 shrink-0 ${isOpen ? 'text-emerald-300' : 'text-white/55'}`}
          aria-hidden
        />
        <span className="font-medium opacity-80">{label}</span>
        <span className="font-mono font-semibold tabular-nums tracking-tight">
          {days > 0 ? `${days}${strings.countdown.dayShort} ` : ''}
          {clock}
        </span>
      </div>
    </div>
  );
}
