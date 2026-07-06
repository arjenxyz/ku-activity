'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { whenPersonnelUiReady } from '@/lib/personnel-app-ready';
import { isPersonnelTwaRuntime } from '@/lib/personnel-app-runtime';
import {
  markNotificationsUnlocked,
  markPushBootstrapAttempted,
  wasPushBootstrapAttempted,
} from '@/lib/personnel-notification-access';
import { fetchPersonnelUnlockContext } from '@/lib/personnel-session-check';
import {
  canAttemptPushSubscribe,
  fetchPushSubscriptionStatus,
  getNotificationPermission,
  registerPersonnelPushIfAuthed,
} from '@/lib/personnel-push-client';

const RETRY_MS = 2500;

function isPersonnelAuthPath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/unlock') ||
    pathname.startsWith('/personnel-panel/sifremi-unuttum') ||
    pathname.startsWith('/personnel-panel/pin-sifirla') ||
    pathname.startsWith('/personnel-panel/basvuru')
  );
}

async function tryRegisterPush(options?: { twaBypassPermission?: boolean }): Promise<boolean> {
  if (wasPushBootstrapAttempted()) {
    const status = await fetchPushSubscriptionStatus();
    if (status?.currentSessionSubscribed) return true;
  }

  const ctx = await fetchPersonnelUnlockContext();
  if (!ctx?.unlocked) return false;

  if (!canAttemptPushSubscribe({ twaBypassPermission: options?.twaBypassPermission })) {
    return false;
  }

  const ok = await registerPersonnelPushIfAuthed({
    twaBypassPermission: options?.twaBypassPermission,
  });
  if (!ok) return false;

  markNotificationsUnlocked();
  markPushBootstrapAttempted();
  return true;
}

/**
 * Oturum + izin hazır olunca push aboneliğini sessizce kaydet.
 * TWA: Android ayarlarından dönünce Notification.permission gecikse bile dener.
 */
export function PersonnelPushBootstrap() {
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isPersonnelAuthPath(pathname)) return;

    let cancelled = false;
    let retryTimer: number | undefined;

    const run = () => {
      if (cancelled) return;

      const twaBypass = isPersonnelTwaRuntime();
      void tryRegisterPush({ twaBypassPermission: twaBypass }).then((ok) => {
        if (cancelled || ok) return;
        if (retryTimer) window.clearInterval(retryTimer);
        retryTimer = window.setInterval(() => {
          void tryRegisterPush({ twaBypassPermission: twaBypass }).then((registered) => {
            if (registered && retryTimer) {
              window.clearInterval(retryTimer);
              retryTimer = undefined;
            }
          });
        }, RETRY_MS);
      });
    };

    const cleanupReady = whenPersonnelUiReady(run);
    const fallback = window.setTimeout(run, 8000);

    return () => {
      cancelled = true;
      cleanupReady();
      window.clearTimeout(fallback);
      if (retryTimer) window.clearInterval(retryTimer);
    };
  }, [pathname]);

  useEffect(() => {
    if (isPersonnelAuthPath(pathname)) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void tryRegisterPush({ twaBypassPermission: isPersonnelTwaRuntime() });
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [pathname]);

  useEffect(() => {
    if (isPersonnelAuthPath(pathname)) return;
    if (getNotificationPermission() !== 'granted') return;
    void tryRegisterPush();
  }, [pathname]);

  return null;
}
