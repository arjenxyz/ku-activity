'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { PersonnelAppIntro } from '@/components/personnel/PersonnelAppIntro';
import {
  hasSeenPersonnelIntro,
  isTrustedWebActivity,
  markPersonnelIntroSeen,
} from '@/lib/personnel-intro';
import { PERSONNEL_PWA_SPLASH_BG } from '@/lib/personnel-pwa-brand';

function shouldSkipIntro(pathname: string) {
  if (pathname.startsWith('/personnel-panel/basvuru')) return true;
  return false;
}

function computeShowIntro(pathname: string): boolean {
  if (typeof window === 'undefined') return false;
  if (isTrustedWebActivity()) return false;
  if (shouldSkipIntro(pathname)) return false;
  if (!window.matchMedia('(max-width: 639px)').matches) return false;
  return !hasSeenPersonnelIntro();
}

function isPersonnelAuthPath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/sifremi-unuttum') ||
    pathname.startsWith('/personnel-panel/pin-sifirla') ||
    pathname.startsWith('/personnel-panel/basvuru')
  );
}

export function PersonnelIntroGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [showIntro, setShowIntro] = useState(false);

  useLayoutEffect(() => {
    if (isTrustedWebActivity()) {
      markPersonnelIntroSeen();
    }
    setShowIntro(computeShowIntro(pathname));
  }, [pathname]);

  useLayoutEffect(() => {
    if (!showIntro) return;
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.backgroundColor = PERSONNEL_PWA_SPLASH_BG;
    document.body.style.overflow = 'hidden';
    return () => {
      if (isPersonnelAuthPath(pathname)) {
        document.documentElement.style.backgroundColor = PERSONNEL_PWA_SPLASH_BG;
        document.body.style.backgroundColor = 'transparent';
      } else {
        document.documentElement.style.backgroundColor = prevHtml;
      }
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [showIntro, pathname]);

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
