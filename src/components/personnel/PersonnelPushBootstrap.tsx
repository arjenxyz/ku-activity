'use client';

import { useEffect } from 'react';
import { whenPersonnelUiReady } from '@/lib/personnel-app-ready';
import { isPersonnelTwaRuntime } from '@/lib/personnel-app-runtime';
import {
  markNotificationsUnlocked,
  markPushBootstrapAttempted,
  wasPushBootstrapAttempted,
} from '@/lib/personnel-notification-access';
import {
  getNotificationPermission,
  requestNotificationPermission,
  subscribePersonnelPush,
} from '@/lib/personnel-push-client';

const PERMISSION_DELAY_MS = 600;

/**
 * APK/TWA: intro / boot overlay bittikten sonra bir kez sistem bildirim izni iste.
 * Erken istek splash geçişinde diyaloğun kaybolmasına yol açar.
 */
export function PersonnelPushBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPersonnelTwaRuntime()) return;
    if (wasPushBootstrapAttempted()) return;

    const requestPushAccess = () => {
      if (wasPushBootstrapAttempted()) return;

      window.setTimeout(() => {
        void (async () => {
          const current = getNotificationPermission();
          if (current === 'granted') {
            const ok = await subscribePersonnelPush({ skipPermissionRequest: true });
            if (ok) {
              markNotificationsUnlocked();
              markPushBootstrapAttempted();
            }
            return;
          }
          if (current === 'denied' || current === 'unsupported') {
            markPushBootstrapAttempted();
            return;
          }

          const permission = await requestNotificationPermission();
          if (permission === 'granted') {
            const ok = await subscribePersonnelPush({ skipPermissionRequest: true });
            if (ok) markNotificationsUnlocked();
          }
          if (permission !== 'default') {
            markPushBootstrapAttempted();
          }
        })();
      }, PERMISSION_DELAY_MS);
    };

    const cleanup = whenPersonnelUiReady(requestPushAccess);

    const fallback = window.setTimeout(() => {
      if (!wasPushBootstrapAttempted()) requestPushAccess();
    }, 12000);

    return () => {
      cleanup();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
