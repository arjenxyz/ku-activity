'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { PersonnelAppIntro } from '@/components/personnel/PersonnelAppIntro';
import {
  hasSeenPersonnelIntro,
  isStandalonePwa,
  markPersonnelIntroSeen,
  PERSONNEL_INTRO_HERO_BG,
  PERSONNEL_INTRO_SPLASH_BG,
} from '@/lib/personnel-intro-splash';

function shouldSkipIntro(pathname: string) {
  if (pathname.startsWith('/personnel-panel/basvuru')) return true;
  return false;
}

function computeShowIntro(pathname: string): boolean {
  if (shouldSkipIntro(pathname)) return false;
  if (!window.matchMedia('(max-width: 639px)').matches) return false;
  return !hasSeenPersonnelIntro();
}

export function PersonnelIntroGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [showIntro, setShowIntro] = useState(false);
  const [startAtHero, setStartAtHero] = useState(false);

  useLayoutEffect(() => {
    const standalone = isStandalonePwa();
    setStartAtHero(standalone);
    setShowIntro(computeShowIntro(pathname));
  }, [pathname]);

  useLayoutEffect(() => {
    if (!showIntro) return;
    const bg = startAtHero ? PERSONNEL_INTRO_HERO_BG : PERSONNEL_INTRO_SPLASH_BG;
    document.documentElement.style.backgroundColor = bg;
    return () => {
      document.documentElement.style.backgroundColor = '';
    };
  }, [showIntro, startAtHero]);

  const handleComplete = () => {
    markPersonnelIntroSeen();
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && (
        <PersonnelAppIntro onComplete={handleComplete} startAtHero={startAtHero} />
      )}
      <div className={showIntro ? 'invisible pointer-events-none' : undefined}>{children}</div>
    </>
  );
}
