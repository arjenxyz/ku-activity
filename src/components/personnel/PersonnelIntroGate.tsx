'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import {
  hasSeenPersonnelIntro,
  markPersonnelIntroSeen,
  PersonnelAppIntro,
} from '@/components/personnel/PersonnelAppIntro';
import { PERSONNEL_INTRO_SPLASH_BG } from '@/lib/personnel-intro-splash';

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

  useLayoutEffect(() => {
    setShowIntro(computeShowIntro(pathname));
  }, [pathname]);

  useLayoutEffect(() => {
    if (!showIntro) return;
    document.documentElement.style.backgroundColor = PERSONNEL_INTRO_SPLASH_BG;
    return () => {
      document.documentElement.style.backgroundColor = '';
    };
  }, [showIntro]);

  const handleComplete = () => {
    markPersonnelIntroSeen();
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && <PersonnelAppIntro onComplete={handleComplete} />}
      <div className={showIntro ? 'invisible pointer-events-none' : undefined}>{children}</div>
    </>
  );
}
