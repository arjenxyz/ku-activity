'use client';

import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { getClosureCountdown } from '@/lib/closure-phase';
import type { ClosurePhase } from '@/lib/closure-phase';

type Props = {
  deadlineAt: string | null;
  phase?: ClosurePhase | string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function ClosureCountdown({ deadlineAt, phase, size = 'md', className = '' }: Props) {
  const strings = useRegistryStrings('components/closure/ClosureCountdown');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = getClosureCountdown(deadlineAt, now);
  if (!parts) return null;

  const phaseLabel =
    phase === 'export_window' ? strings.phaseExport : phase === 'pending_consents' ? strings.phasePending : null;

  const digitClass =
    size === 'lg'
      ? 'text-3xl sm:text-4xl font-bold tabular-nums'
      : size === 'sm'
        ? 'text-lg font-bold tabular-nums'
        : 'text-2xl font-bold tabular-nums';

  const unitClass =
    size === 'lg' ? 'text-[10px] sm:text-xs uppercase tracking-wide' : 'text-[10px] uppercase tracking-wide';

  if (parts.expired) {
    return (
      <div className={`text-center ${className}`}>
        {phaseLabel && (
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">{phaseLabel}</p>
        )}
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{strings.expired}</p>
      </div>
    );
  }

  const segments = [
    { value: parts.days, label: strings.days, show: parts.days > 0 || size === 'lg' },
    { value: parts.hours, label: strings.hours, show: true },
    { value: parts.minutes, label: strings.minutes, show: true },
    { value: parts.seconds, label: strings.seconds, show: true },
  ].filter((s) => s.show);

  return (
    <div className={className}>
      {phaseLabel && (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2 text-center">{phaseLabel}</p>
      )}
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center mb-3">{strings.title}</p>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[3.5rem] rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-200/80 dark:border-amber-800/50 px-2 py-2 sm:py-2.5 shadow-sm">
              <span className={`${digitClass} text-slate-900 dark:text-white`}>{pad(seg.value)}</span>
              <span className={`${unitClass} text-slate-500 dark:text-slate-400 mt-0.5`}>{seg.label}</span>
            </div>
            {i < segments.length - 1 && (
              <span className={`${digitClass} text-amber-500/80 pb-4`} aria-hidden>
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
