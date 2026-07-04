'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { AdminAppIntro } from '@/components/admin/AdminAppIntro';
import { hasSeenAdminIntro, markAdminIntroSeen } from '@/lib/admin-intro';
import { ADMIN_PWA_SPLASH_BG } from '@/lib/admin-pwa-brand';

function shouldSkipIntro(pathname: string) {
  return pathname === '/admin-panel/login' || pathname === '/admin-panel/register';
}

function computeShowIntro(pathname: string): boolean {
  if (typeof window === 'undefined') return false;
  if (shouldSkipIntro(pathname)) return false;
  if (!window.matchMedia('(max-width: 639px)').matches) return false;
  return !hasSeenAdminIntro();
}

function isAdminAuthPath(pathname: string) {
  return pathname === '/admin-panel/login' || pathname === '/admin-panel/register';
}

export function AdminIntroGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useLayoutEffect(() => {
    const shouldShow = computeShowIntro(pathname);
    setShowIntro(shouldShow);
    if (!shouldShow) {
      document.getElementById('cl-admin-intro-boot')?.remove();
    }
  }, [pathname]);

  useLayoutEffect(() => {
    if (showIntro !== true) return;
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.backgroundColor = ADMIN_PWA_SPLASH_BG;
    document.body.style.backgroundColor = ADMIN_PWA_SPLASH_BG;
    document.body.style.overflow = 'hidden';
    return () => {
      if (isAdminAuthPath(pathname)) {
        document.documentElement.style.backgroundColor = ADMIN_PWA_SPLASH_BG;
        document.body.style.backgroundColor = ADMIN_PWA_SPLASH_BG;
      } else {
        document.documentElement.style.backgroundColor = prevHtml;
        document.body.style.backgroundColor = prevBody;
      }
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [showIntro, pathname]);

  const handleComplete = () => {
    markAdminIntroSeen();
    document.getElementById('cl-admin-intro-boot')?.remove();
    setShowIntro(false);
  };

  return (
    <>
      {showIntro === true && <AdminAppIntro onComplete={handleComplete} />}
      {showIntro === false && children}
    </>
  );
}
