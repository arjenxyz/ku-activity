'use client';

import { useLayoutEffect } from 'react';
import { PERSONNEL_PWA_SPLASH_BG } from '@/lib/personnel-pwa-brand';

/** Giriş / başvuru — sayfa zemini, intro geçişinde kaybolmasın */
export function usePersonnelAuthPageBackground(background = PERSONNEL_PWA_SPLASH_BG) {
  useLayoutEffect(() => {
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    document.documentElement.style.backgroundColor = background;
    document.body.style.backgroundColor = 'transparent';
    return () => {
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, [background]);
}
