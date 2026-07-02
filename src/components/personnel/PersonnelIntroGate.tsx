'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  hasSeenPersonnelIntro,
  markPersonnelIntroSeen,
  PersonnelAppIntro,
} from '@/components/personnel/PersonnelAppIntro';
import { isStandalonePwa } from '@/lib/pwa-standalone';

function shouldSkipIntro(pathname: string) {
  if (pathname.startsWith('/personnel-panel/basvuru')) return true;
  if (isStandalonePwa()) return true;
  return false;
}

export function PersonnelIntroGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (shouldSkipIntro(pathname)) return;
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    if (!mobile || hasSeenPersonnelIntro()) return;
    setShowIntro(true);
  }, [pathname]);

  const handleComplete = () => {
    markPersonnelIntroSeen();
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && <PersonnelAppIntro onComplete={handleComplete} />}
      {children}
    </>
  );
}
