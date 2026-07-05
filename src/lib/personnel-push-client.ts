'use client';

import { markNotificationsUnlocked } from '@/lib/personnel-notification-storage';

const VAPID_KEY_STORAGE = 'crewledger-vapid-public-key';(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function keyBuffersMatch(existing: ArrayBuffer | null, desired: Uint8Array): boolean {
  if (!existing || existing.byteLength !== desired.byteLength) return false;
  const view = new Uint8Array(existing);
  for (let i = 0; i < view.length; i += 1) {
    if (view[i] !== desired[i]) return false;
  }
  return true;
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  const res = await fetch('/api/personnel/push/vapid-public-key', { credentials: 'include' });
  if (!res.ok) return null;
  const data = (await res.json()) as { enabled?: boolean; publicKey?: string | null; keyPairValid?: boolean };
  if (!data.enabled || !data.publicKey) return null;
  if (data.keyPairValid === false) {
    console.warn('[push] VAPID key pair invalid on server — contact admin');
  }
  return data.publicKey;
}

async function serverHasPushSubscription(): Promise<boolean | null> {
  try {
    const res = await fetch('/api/personnel/push/status', { credentials: 'include' });
    if (!res.ok) return null;
    const data = (await res.json()) as { subscribed?: boolean };
    return data.subscribed === true;
  } catch {
    return null;
  }
}

export async function fetchPushSubscriptionStatus(): Promise<boolean | null> {
  return serverHasPushSubscription();
}

export async function hasLocalPushSubscription(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

export async function subscribePersonnelPush(options?: {
  force?: boolean;
  skipPermissionRequest?: boolean;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (Notification.permission === 'denied') return false;

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) return false;

  if (Notification.permission !== 'granted') {
    if (options?.skipPermissionRequest) return false;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
  }

  const registration = await navigator.serviceWorker.ready;
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  const storedVapidKey = localStorage.getItem(VAPID_KEY_STORAGE);
  const vapidRotated = storedVapidKey !== null && storedVapidKey !== publicKey;
  const serverSubscribed = options?.force ? false : await serverHasPushSubscription();
  const forceRefresh =
    options?.force === true || vapidRotated || serverSubscribed === false;

  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const existingKey = subscription.options?.applicationServerKey ?? null;
    const keyMismatch = !keyBuffersMatch(existingKey, applicationServerKey);
    if (forceRefresh || keyMismatch) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }

  subscription =
    subscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }));

  const json = subscription.toJSON();
  const res = await fetch('/api/personnel/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    }),
  });

  if (res.ok) {
    localStorage.setItem(VAPID_KEY_STORAGE, publicKey);
    markNotificationsUnlocked();
  }

  return res.ok;
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** Tarayıcı bildirim izni — panel erişimi buna bağlı; push aboneliği ayrı adım */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  const current = getNotificationPermission();
  if (current === 'unsupported' || current !== 'default') return current;
  return Notification.requestPermission();
}
