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

        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
          type: 'classic',
        });
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        await registration.update().catch(() => undefined);
      } catch (error) {
        console.error('Service worker işlemi başarısız:', error);
      }
    };

    void setup();
  }, []);

  return null;
}
