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
        markPushBootstrapAttempted();

        void (async () => {
          const current = getNotificationPermission();
          if (current === 'granted') {
            markNotificationsUnlocked();
            await subscribePersonnelPush({ skipPermissionRequest: true });
            return;
          }
          if (current === 'denied' || current === 'unsupported') return;

          const permission = await requestNotificationPermission();
          if (permission === 'granted') {
            markNotificationsUnlocked();
            await subscribePersonnelPush({ skipPermissionRequest: true });
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
