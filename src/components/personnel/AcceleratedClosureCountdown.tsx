'use client';

import { useEffect, useRef, useState } from 'react';
import { ClosureCountdown } from '@/components/closure/ClosureCountdown';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import type { ClosurePhase } from '@/lib/closure-phase';

type Props = {
  deadlineAt: string | null;
  phase?: ClosurePhase | string | null;
  accelerateFromDeadline?: string | null;
  accelerationNonce?: number;
};

const ACCEL_DURATION_MS = 2800;

export function AcceleratedClosureCountdown({
  deadlineAt,
  phase,
  accelerateFromDeadline,
  accelerationNonce = 0,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelClosureAcceleration');
  const [displayDeadline, setDisplayDeadline] = useState(deadlineAt);
  const [isAccelerating, setIsAccelerating] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayDeadline(deadlineAt);
  }, [deadlineAt]);

  useEffect(() => {
    if (!accelerationNonce || !deadlineAt || !accelerateFromDeadline) return;

    const targetMs = new Date(deadlineAt).getTime();
    const startMs = new Date(accelerateFromDeadline).getTime();
    if (targetMs >= startMs) return;

    setIsAccelerating(true);
    const animStart = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - animStart) / ACCEL_DURATION_MS);
      const eased = 1 - (1 - t) ** 4;
      const currentMs = startMs + (targetMs - startMs) * eased;
      setDisplayDeadline(new Date(currentMs).toISOString());

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayDeadline(deadlineAt);
        setIsAccelerating(false);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [accelerationNonce, deadlineAt, accelerateFromDeadline]);

  return (
    <div className="relative">
      {isAccelerating ? (
        <div
          className="pointer-events-none absolute inset-0 -m-3 rounded-3xl bg-gradient-to-r from-amber-400/20 via-orange-500/25 to-red-500/20 animate-pulse"
          aria-hidden
        />
      ) : null}
      <div
        className={`relative transition-transform duration-300 ${
          isAccelerating ? 'scale-[1.02] motion-safe:animate-[closureAccelShake_0.4s_ease-in-out]' : ''
        }`}
      >
        <ClosureCountdown
          deadlineAt={displayDeadline}
          phase={phase}
          size="lg"
          variant="premium"
          showTitle={false}
          showPhase={false}
          className={isAccelerating ? '[&_span]:text-red-600 dark:[&_span]:text-red-400' : ''}
        />
      </div>
      {isAccelerating ? (
        <p className="mt-3 text-center text-xs font-semibold text-amber-700 dark:text-amber-300 animate-pulse">
          {strings.acceleratingLabel}
        </p>
      ) : null}
    </div>
  );
}
