'use client';

import { useEffect } from 'react';
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

/**
 * APK/TWA: oturum açıldıktan sonra bir kez sistem bildirim izni iste.
 * Chrome sekmesinde otomatik istemez — zile tıklanınca sorulur.
 */
export function PersonnelPushBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isPersonnelTwaRuntime()) return;
    if (wasPushBootstrapAttempted()) return;

    const timer = window.setTimeout(() => {
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
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
