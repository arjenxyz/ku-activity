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
  getNotificationPermission,
  registerPersonnelPushIfAuthed,
} from '@/lib/personnel-push-client';

const RETRY_MS = 2500;
const MAX_RETRIES = 5;

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

/**
 * Arka planda push aboneliğini SESSİZCE kaydeder — izin sorusu ASLA açmaz.
 * İzin isteme akışı yalnızca PersonnelNotificationPermissionPrompt (kullanıcı butonu) ile yürür.
 */
async function tryRegisterPush(): Promise<boolean> {
  if (wasPushBootstrapAttempted()) {
    const status = await fetchPushSubscriptionStatus();
    if (status?.currentSessionSubscribed) return true;
  }

  const ctx = await fetchPersonnelUnlockContext();
  if (!ctx?.unlocked) return false;

  const ok = await registerPersonnelPushIfAuthed({
    twaBypassPermission: isPersonnelTwaRuntime(),
    allowPrompt: false,
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
        // İzin verilmemişse yeniden denemek anlamsız (prompt bileşeni izni isteyecek).
        // Retry yalnızca izin verilmiş ama abonelik teknik nedenle (SW hazır değil vb.) başarısızsa.
        if (getNotificationPermission() !== 'granted') return;
        if (retryTimer) window.clearInterval(retryTimer);
        let attempts = 0;
        retryTimer = window.setInterval(() => {
          attempts += 1;
          void tryRegisterPush().then((registered) => {
            if ((registered || attempts >= MAX_RETRIES) && retryTimer) {
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
      // Sessiz yeniden deneme; izin zaten verilmişse abone olur, prompt açmaz.
      void tryRegisterPush();
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [pathname]);

  return null;
}
