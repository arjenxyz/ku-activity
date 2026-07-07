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
  fetchPushSubscriptionStatus,
  registerPersonnelPushIfAuthed,
  syncNotificationPermissionForPush,
} from '@/lib/personnel-push-client';

const RETRY_MS = 2500;

function isPersonnelAuthPath(pathname: string) {
  return (
    pathname.startsWith('/personnel-panel/basla') ||
    pathname.startsWith('/personnel-panel/login') ||
    pathname.startsWith('/personnel-panel/unlock') ||
    pathname.startsWith('/personnel-panel/sifremi-unuttum') ||
    pathname.startsWith('/personnel-panel/pin-sifirla') ||
    pathname.startsWith('/personnel-panel/basvuru')
  );
}

async function tryRegisterPush(options?: { twaAfterSettings?: boolean }): Promise<boolean> {
  if (wasPushBootstrapAttempted()) {
    const status = await fetchPushSubscriptionStatus();
    if (status?.currentSessionSubscribed) return true;
  }

  const ctx = await fetchPersonnelUnlockContext();
  if (!ctx?.unlocked) return false;

  const twa = isPersonnelTwaRuntime();
  if (twa || options?.twaAfterSettings) {
    await syncNotificationPermissionForPush({ twaAfterSettings: true });
  }

  const ok = await registerPersonnelPushIfAuthed({
    force: Boolean(options?.twaAfterSettings),
    twaBypassPermission: twa || Boolean(options?.twaAfterSettings),
  });
  if (!ok) return false;

  markNotificationsUnlocked();
  markPushBootstrapAttempted();
  return true;
}

/**
 * Oturum + izin hazır olunca push aboneliğini sessizce kaydet.
 * TWA: ayarlardan dönünce requestPermission ile WebView iznini senkronize eder.
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

      void tryRegisterPush().then((ok) => {
        if (cancelled || ok) return;
        if (retryTimer) window.clearInterval(retryTimer);
        retryTimer = window.setInterval(() => {
          void tryRegisterPush().then((registered) => {
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
      void tryRegisterPush({ twaAfterSettings: isPersonnelTwaRuntime() });
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [pathname]);

  return null;
}
