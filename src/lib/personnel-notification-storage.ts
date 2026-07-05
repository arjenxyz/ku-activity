'use client';

export const NOTIFICATIONS_UNLOCKED_KEY = 'crewledger-notifications-unlocked';
export const PUSH_BOOTSTRAP_KEY = 'crewledger-push-bootstrap-v1';

export function isNotificationsUnlockPersisted(): boolean {
  try {
    return localStorage.getItem(NOTIFICATIONS_UNLOCKED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markNotificationsUnlocked() {
  try {
    localStorage.setItem(NOTIFICATIONS_UNLOCKED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function wasPushBootstrapAttempted(): boolean {
  try {
    return localStorage.getItem(PUSH_BOOTSTRAP_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPushBootstrapAttempted() {
  try {
    localStorage.setItem(PUSH_BOOTSTRAP_KEY, '1');
  } catch {
    /* ignore */
  }
}
