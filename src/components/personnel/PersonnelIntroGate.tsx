'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { PersonnelAppIntro } from '@/components/personnel/PersonnelAppIntro';
import { PersonnelPushBootstrap } from '@/components/personnel/PersonnelPushBootstrap';
import { markPersonnelUiReady } from '@/lib/personnel-app-ready';
import { hasSeenPersonnelIntro, markPersonnelIntroSeen } from '@/lib/personnel-intro';
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

function isPersonnelAuthPath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/sifremi-unuttum') ||
    pathname.startsWith('/personnel-panel/pin-sifirla') ||
    pathname.startsWith('/personnel-panel/basvuru')
  );
}

/** Intro / boot overlay kapandıktan sonra bildirim izni için sinyal */
function scheduleUiReady() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => markPersonnelUiReady(), 400);
    });
  });
}

/** Intro karar verilene kadar boot overlay kalsın */
export function PersonnelIntroGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const shouldShow = computeShowIntro(pathname);
    setShowIntro(shouldShow);
    if (!shouldShow) {
      document.getElementById('cl-intro-boot')?.remove();
      scheduleUiReady();
    }
  }, [pathname]);

  useLayoutEffect(() => {
    if (showIntro !== true) return;
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.backgroundColor = PERSONNEL_PWA_SPLASH_BG;
    document.body.style.backgroundColor = PERSONNEL_PWA_SPLASH_BG;
    document.body.style.overflow = 'hidden';
    return () => {
      if (isPersonnelAuthPath(pathname)) {
        document.documentElement.style.backgroundColor = PERSONNEL_PWA_SPLASH_BG;
        document.body.style.backgroundColor = PERSONNEL_PWA_SPLASH_BG;
      } else {
        document.documentElement.style.backgroundColor = prevHtml;
        document.body.style.backgroundColor = prevBody;
      }
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [showIntro, pathname]);

  const handleComplete = () => {
    markPersonnelIntroSeen();
    document.getElementById('cl-intro-boot')?.remove();
    setShowIntro(false);
    scheduleUiReady();
  };

  return (
    <>
      {showIntro === true && <PersonnelAppIntro onComplete={handleComplete} />}
      {showIntro === false && (
        <>
          <PersonnelPushBootstrap />
          {children}
        </>
      )}
    </>
  );
}
