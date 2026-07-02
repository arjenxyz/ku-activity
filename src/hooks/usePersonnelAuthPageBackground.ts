'use client';

import { useLayoutEffect } from 'react';
import { PERSONNEL_PWA_SPLASH_BG } from '@/lib/personnel-pwa-brand';

/** Giriş / başvuru — body beyazını kapat, intro → login geçişinde arka plan kaybolmasın */
export function usePersonnelAuthPageBackground() {
  useLayoutEffect(() => {
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = PERSONNEL_PWA_SPLASH_BG;
    document.body.style.backgroundColor = 'transparent';
    return () => {
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);
}
