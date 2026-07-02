'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { PersonnelAppIntro } from '@/components/personnel/PersonnelAppIntro';
import {
  hasSeenPersonnelIntro,
  markPersonnelIntroSeen,
} from '@/lib/personnel-intro';
import { PERSONNEL_PWA_SPLASH_BG } from '@/lib/personnel-pwa-brand';

function shouldSkipIntro(pathname: string) {
  if (pathname.startsWith('/personnel-panel/basvuru')) return true;
  return false;
}

function computeShowIntro(pathname: string): boolean {
  if (typeof window === 'undefined') return false;
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
    const prev = document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = PERSONNEL_PWA_SPLASH_BG;
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.backgroundColor = prev;
      document.body.style.overflow = '';
    };
  }, [showIntro]);

  const handleComplete = () => {
    markPersonnelIntroSeen();
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && <PersonnelAppIntro onComplete={handleComplete} />}
      <div aria-hidden={showIntro} className={showIntro ? 'invisible pointer-events-none' : undefined}>
        {children}
      </div>
    </>
  );
}
