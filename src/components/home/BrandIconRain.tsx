'use client';

import type { CSSProperties } from 'react';
import Image from 'next/image';
import { CREWLEDGER_APP_ICON } from '@/lib/brand';
import { PLAY_STORE_ADMIN_ICON, PLAY_STORE_PERSONNEL_ICON } from '@/lib/play-store';

const BRAND_ICONS = [CREWLEDGER_APP_ICON, PLAY_STORE_PERSONNEL_ICON, PLAY_STORE_ADMIN_ICON] as const;

type RainParticle = {
  id: number;
  iconIndex: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  rotation: number;
  opacity: number;
  hideOnMobile: boolean;
};

function buildParticles(count: number): RainParticle[] {
  let seed = 42;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  return Array.from({ length: count }, (_, id) => ({
    id,
    iconIndex: id % 3,
    left: next() * 90 + 5,
    size: Math.round(next() * 22 + 30),
    duration: next() * 12 + 14,
    delay: -(next() * 28),
    drift: (next() - 0.5) * 72,
    rotation: (next() - 0.5) * 48,
    opacity: next() * 0.14 + 0.1,
    hideOnMobile: id % 2 === 0,
  }));
}

const PARTICLES = buildParticles(30);

export function BrandIconRain() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-transparent to-white/70 dark:from-slate-950/80 dark:to-slate-950/80" />
      <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)]">
        {PARTICLES.map((particle) => (
          <div
            key={particle.id}
            className={`brand-rain-particle absolute ${particle.hideOnMobile ? 'hidden sm:block' : ''}`}
            style={
              {
                left: `${particle.left}%`,
                width: particle.size,
                height: particle.size,
                '--rain-duration': `${particle.duration}s`,
                '--rain-delay': `${particle.delay}s`,
                '--rain-drift': `${particle.drift}px`,
                '--rain-rotate': `${particle.rotation}deg`,
                '--rain-opacity': particle.opacity,
              } as CSSProperties
            }
          >
            <Image
              src={BRAND_ICONS[particle.iconIndex]}
              alt=""
              width={particle.size}
              height={particle.size}
              className="h-full w-full rounded-xl object-cover shadow-sm"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
