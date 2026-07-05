'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { whenPersonnelUiReady } from '@/lib/personnel-app-ready';
import { isPersonnelTwaRuntime } from '@/lib/personnel-app-runtime';
import { hasActivePersonnelSession } from '@/lib/personnel-session-check';
import {
  markNotificationsUnlocked,
  markPushBootstrapAttempted,
  wasPushBootstrapAttempted,
} from '@/lib/personnel-notification-access';
import {
  getNotificationPermission,
  registerPersonnelPushIfAuthed,
  requestNotificationPermission,
} from '@/lib/personnel-push-client';

const PERMISSION_DELAY_MS = 600;
const SESSION_RETRY_MS = 2500;

function isPersonnelAuthPath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/sifremi-unuttum') ||
    pathname.startsWith('/personnel-panel/pin-sifirla') ||
    pathname.startsWith('/personnel-panel/basvuru')
  );
}

/**
 * APK/TWA: intro sonrası izin iste; abonelik yalnızca personel oturumu açıkken kaydedilir.
 */
export function PersonnelPushBootstrap() {
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPersonnelTwaRuntime()) return;

    let cancelled = false;
    let retryTimer: number | undefined;

    const tryRegister = async (): Promise<boolean> => {
      if (cancelled || wasPushBootstrapAttempted()) return false;
      if (getNotificationPermission() !== 'granted') return false;
      if (!(await hasActivePersonnelSession())) return false;

      const ok = await registerPersonnelPushIfAuthed();
      if (!ok) return false;

      markNotificationsUnlocked();
      markPushBootstrapAttempted();
      return true;
    };

    const scheduleSessionRetry = () => {
      if (retryTimer) window.clearInterval(retryTimer);
      retryTimer = window.setInterval(() => {
        void tryRegister().then((ok) => {
          if (ok && retryTimer) {
            window.clearInterval(retryTimer);
            retryTimer = undefined;
          }
        });
      }, SESSION_RETRY_MS);
    };

    const run = () => {
      if (cancelled || wasPushBootstrapAttempted()) return;

      window.setTimeout(() => {
        void (async () => {
          if (cancelled || wasPushBootstrapAttempted()) return;

          let permission = getNotificationPermission();
          if (permission === 'granted') {
            if (await tryRegister()) return;
            scheduleSessionRetry();
            return;
          }
          if (permission === 'denied' || permission === 'unsupported') {
            markPushBootstrapAttempted();
            return;
          }

          permission = await requestNotificationPermission();
          if (permission === 'granted') {
            if (await tryRegister()) return;
            scheduleSessionRetry();
            return;
          }
          if (permission !== 'default') {
            markPushBootstrapAttempted();
          }
        })();
      }, PERMISSION_DELAY_MS);
    };

    const cleanupReady = whenPersonnelUiReady(run);
    const fallback = window.setTimeout(run, 12000);

    return () => {
      cancelled = true;
      cleanupReady();
      window.clearTimeout(fallback);
      if (retryTimer) window.clearInterval(retryTimer);
    };
  }, []);

  useEffect(() => {
    if (!isPersonnelTwaRuntime()) return;
    if (wasPushBootstrapAttempted()) return;
    if (isPersonnelAuthPath(pathname)) return;
    if (getNotificationPermission() !== 'granted') return;

    void registerPersonnelPushIfAuthed().then((ok) => {
      if (ok) {
        markNotificationsUnlocked();
        markPushBootstrapAttempted();
      }
    });
  }, [pathname]);

  useEffect(() => {
    if (!isPersonnelTwaRuntime()) return;
    if (wasPushBootstrapAttempted()) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (getNotificationPermission() !== 'granted') return;
      void registerPersonnelPushIfAuthed().then((ok) => {
        if (ok) {
          markNotificationsUnlocked();
          markPushBootstrapAttempted();
        }
      });
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return null;
}
