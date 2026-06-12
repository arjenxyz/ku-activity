'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const isDev = process.env.NODE_ENV === 'development';

    const setup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();

        if (isDev) {
          await Promise.all(registrations.map((r) => r.unregister()));
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
          return;
        }

        await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
      } catch (error) {
        console.error('Service worker işlemi başarısız:', error);
      }
    };

    if (document.readyState === 'complete') {
      setup();
    } else {
      window.addEventListener('load', setup, { once: true });
    }
  }, []);

  return null;
}
