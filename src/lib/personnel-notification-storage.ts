'use client';

export const NOTIFICATIONS_UNLOCKED_KEY = 'crewledger-notifications-unlocked';
export const PUSH_BOOTSTRAP_KEY = 'crewledger-push-bootstrap-v1';
export const NOTIFICATION_PROMPT_DISMISS_KEY = 'crewledger-notification-prompt-dismiss';
export const NOTIFICATIONS_MUTED_KEY = 'crewledger-notifications-muted';
export const NOTIFICATION_SOUND_ENABLED_KEY = 'crewledger-notification-sound-enabled';

const NOTIFICATION_PROMPT_DISMISS_DAYS = 14;

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

export function wasNotificationPromptDismissed(): boolean {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PROMPT_DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return raw === '1';
    return Date.now() - ts < NOTIFICATION_PROMPT_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function markNotificationPromptDismissed() {
  try {
    localStorage.setItem(NOTIFICATION_PROMPT_DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function isNotificationsMuted(): boolean {
  try {
    return localStorage.getItem(NOTIFICATIONS_MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setNotificationsMuted(muted: boolean) {
  try {
    localStorage.setItem(NOTIFICATIONS_MUTED_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/** Varsayılan: ses açık */
export function isNotificationSoundEnabled(): boolean {
  try {
    const raw = localStorage.getItem(NOTIFICATION_SOUND_ENABLED_KEY);
    if (raw === null) return true;
    return raw !== '0';
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(NOTIFICATION_SOUND_ENABLED_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}
