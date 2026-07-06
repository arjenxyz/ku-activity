'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isPersonnelTwaRuntime } from '@/lib/personnel-app-runtime';
import {
  markNotificationsUnlocked,
  markPushBootstrapAttempted,
  wasPushBootstrapAttempted,
} from '@/lib/personnel-notification-access';
import { fetchPersonnelUnlockContext } from '@/lib/personnel-session-check';
import { getNotificationPermission, registerPersonnelPushIfAuthed } from '@/lib/personnel-push-client';

const SESSION_RETRY_MS = 2500;

function isPersonnelAuthPath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/sifremi-unuttum') ||
    pathname.startsWith('/personnel-panel/pin-sifirla') ||
    pathname.startsWith('/personnel-panel/basvuru')
  );
}

/** İzin verildiyse push aboneliğini sessizce kaydet (soru PersonnelNotificationPermissionPrompt’ta). */
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
      const ctx = await fetchPersonnelUnlockContext();
      if (!ctx?.unlocked) return false;

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

    void tryRegister().then((ok) => {
      if (!ok) scheduleSessionRetry();
    });

    return () => {
      cancelled = true;
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
