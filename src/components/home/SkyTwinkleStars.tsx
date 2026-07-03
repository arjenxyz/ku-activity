'use client';

import type { CSSProperties } from 'react';
import { useMemo } from 'react';

type Star = {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  minOpacity: number;
  maxOpacity: number;
  glow: boolean;
  cool: boolean;
};

function buildStars(count: number, maxTopPercent: number): Star[] {
  let seed = 77;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  return Array.from({ length: count }, (_, id) => {
    const roll = next();
    return {
      id,
      left: next() * 94 + 3,
      top: next() * maxTopPercent + 4,
      size: roll < 0.55 ? 1.5 : roll < 0.85 ? 2.5 : 3.5,
      duration: next() * 3.5 + 2.2,
      delay: -(next() * 7),
      minOpacity: next() * 0.18 + 0.08,
      maxOpacity: next() * 0.35 + 0.55,
      glow: next() > 0.68,
      cool: next() > 0.55,
    };
  });
}

type SkyTwinkleStarsProps = {
  className?: string;
  /** Maske: yıldızların tam göründüğü üst bölüm (%) */
  maskSolidEnd?: number;
  /** Maske: şeffaflığa geçiş bitişi (%) — inşaat silüetinin altında kalır */
  maskFadeEnd?: number;
  /** Yıldızların yerleşebileceği maksimum üst yükseklik (%) */
  maxTopPercent?: number;
  density?: number;
};

export function SkyTwinkleStars({
  className = '',
  maskSolidEnd = 26,
  maskFadeEnd = 40,
  maxTopPercent = 32,
  density = 40,
}: SkyTwinkleStarsProps) {
  const stars = useMemo(() => buildStars(density, maxTopPercent), [density, maxTopPercent]);
  const midFade = (maskSolidEnd + maskFadeEnd) / 2;
  const mask = `linear-gradient(to bottom, black 0%, black ${maskSolidEnd}%, rgba(0,0,0,0.45) ${midFade}%, transparent ${maskFadeEnd}%)`;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      aria-hidden
    >
      {stars.map((star) => (
        <span
          key={star.id}
          className={`sky-twinkle-star absolute rounded-full ${star.glow ? 'sky-twinkle-star--glow' : ''} ${
            star.cool ? 'bg-sky-100' : 'bg-white'
          }`}
          style={
            {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              '--twinkle-duration': `${star.duration}s`,
              '--twinkle-delay': `${star.delay}s`,
              '--star-min-opacity': star.minOpacity,
              '--star-max-opacity': star.maxOpacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
