'use client';

import { useEffect, useState } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { getClosureCountdown } from '@/lib/closure-phase';
import type { ClosurePhase } from '@/lib/closure-phase';

type Props = {
  deadlineAt: string | null;
  phase?: ClosurePhase | string | null;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'premium';
  showTitle?: boolean;
  className?: string;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function TimerSegment({
  value,
  label,
  size,
  premium,
}: {
  value: number;
  label: string;
  size: 'sm' | 'md' | 'lg';
  premium: boolean;
}) {
  const digitClass = premium
    ? size === 'lg'
      ? 'text-[2rem] sm:text-[2.35rem] leading-none font-bold tabular-nums tracking-tight text-[#0E1548] dark:text-white'
      : size === 'sm'
        ? 'text-xl leading-none font-bold tabular-nums text-[#0E1548] dark:text-white'
        : 'text-2xl leading-none font-bold tabular-nums text-[#0E1548] dark:text-white'
    : size === 'lg'
      ? 'text-3xl sm:text-4xl font-bold tabular-nums'
      : size === 'sm'
        ? 'text-lg font-bold tabular-nums'
        : 'text-2xl font-bold tabular-nums';

  const boxClass = premium
    ? 'min-w-[3.75rem] sm:min-w-[4.25rem] rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-700/80 shadow-[0_8px_24px_rgba(14,21,72,0.07)] px-2.5 py-3 sm:py-3.5 flex flex-col items-center gap-1.5'
    : 'flex flex-col items-center min-w-[3rem] sm:min-w-[3.5rem] rounded-xl bg-white/80 dark:bg-slate-900/60 border border-amber-200/80 dark:border-amber-800/50 px-2 py-2 sm:py-2.5 shadow-sm';

  const labelClass = premium
    ? 'text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500'
    : 'text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mt-0.5';

  return (
    <div className={boxClass}>
      <span className={digitClass}>{pad(value)}</span>
      <span className={labelClass}>{label}</span>
    </div>
  );
}

export function ClosureCountdown({
  deadlineAt,
  phase,
  size = 'md',
  variant = 'premium',
  showTitle = true,
  className = '',
}: Props) {
  const strings = useRegistryStrings('components/closure/ClosureCountdown');
  const [now, setNow] = useState(() => Date.now());
  const premium = variant === 'premium';

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = getClosureCountdown(deadlineAt, now);
  if (!parts) return null;

  const phaseLabel =
    phase === 'export_window'
      ? strings.phaseExport
      : phase === 'pending_consents'
        ? strings.phasePending
        : null;

  if (parts.expired) {
    return (
      <div className={`text-center ${className}`}>
        {phaseLabel && (
          <span className="inline-flex mb-3 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-semibold">
            {phaseLabel}
          </span>
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

  const colonClass = premium
    ? 'text-xl sm:text-2xl font-light text-amber-400/90 pb-6 select-none'
    : 'text-2xl font-bold text-amber-500/80 pb-4';

  return (
    <div className={className}>
      {phaseLabel && (
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-amber-100/90 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-semibold tracking-wide border border-amber-200/60 dark:border-amber-700/50">
            {phaseLabel}
          </span>
        </div>
      )}

      {showTitle ? (
        <p
          className={
            premium
              ? 'text-sm font-semibold text-slate-600 dark:text-slate-300 text-center mb-4 tracking-wide'
              : 'text-xs font-semibold text-slate-600 dark:text-slate-400 text-center mb-3'
          }
        >
          {strings.title}
        </p>
      ) : null}

      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-1.5 sm:gap-2">
            <TimerSegment value={seg.value} label={seg.label} size={size} premium={premium} />
            {i < segments.length - 1 && (
              <span className={colonClass} aria-hidden>
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
