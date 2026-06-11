'use client';

import { useEffect, useState } from 'react';

type AnimatedCounterProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

function formatValue(value: number, decimals: number, suffix: string) {
  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toString();
  return `${formatted}${suffix}`;
}

export function AnimatedCounter({ value, decimals = 0, suffix = '', className = '' }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(() => formatValue(0, decimals, suffix));

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const duration = 800;

    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const current = from + (value - from) * progress;
      setDisplay(formatValue(current, decimals, suffix));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, decimals, suffix]);

  return <span className={className}>{display}</span>;
}
