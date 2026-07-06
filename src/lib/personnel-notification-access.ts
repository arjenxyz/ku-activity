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

/** Panel erişimi — bir kez açıldıysa yenilemede tekrar sorma */
export async function resolvePersonnelNotificationAccess(): Promise<NotificationAccess> {
  if (isNotificationsUnlockPersisted()) return 'granted';

  const permission = getNotificationPermission();
  if (permission === 'granted') {
    markNotificationsUnlocked();
    return 'granted';
  }
  if (permission === 'unsupported') return 'unsupported';
  if (permission === 'denied') return 'denied';

  if (await hasLocalPushSubscription()) {
    markNotificationsUnlocked();
    return 'granted';
  }

  const serverSubscribed = await fetchPushSubscriptionStatus();
  if (serverSubscribed) {
    markNotificationsUnlocked();
    return 'granted';
  }

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
