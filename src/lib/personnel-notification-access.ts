'use client';

import {
  isNotificationsUnlockPersisted,
  markNotificationsUnlocked,
} from '@/lib/personnel-notification-storage';
import {
  fetchPushSubscriptionStatus,
  getNotificationPermission,
  hasLocalPushSubscription,
} from '@/lib/personnel-push-client';

export type NotificationAccess = 'granted' | 'default' | 'denied' | 'unsupported';

/** Panel erişimi — bu cihazda abonelik veya yerel izin gerekli */
export async function resolvePersonnelNotificationAccess(): Promise<NotificationAccess> {
  if (isNotificationsUnlockPersisted()) return 'granted';

  const permission = getNotificationPermission();
  if (permission === 'unsupported') return 'unsupported';
  if (permission === 'denied') return 'denied';

  if (await hasLocalPushSubscription()) {
    const serverStatus = await fetchPushSubscriptionStatus();
    if (serverStatus?.currentSessionSubscribed) {
      markNotificationsUnlocked();
      return 'granted';
    }
  }

  const serverStatus = await fetchPushSubscriptionStatus();
  if (serverStatus?.currentSessionSubscribed) {
    markNotificationsUnlocked();
    return 'granted';
  }

  if (permission === 'granted') return 'default';

  return permission;
}

export {
  isNotificationsUnlockPersisted,
  markNotificationsUnlocked,
  markNotificationPromptDismissed,
  markPushBootstrapAttempted,
  wasNotificationPromptDismissed,
  wasPushBootstrapAttempted,
} from '@/lib/personnel-notification-storage';
