'use client';

import { isPersonnelTwaRuntime } from '@/lib/personnel-app-runtime';
import { markNotificationsUnlocked } from '@/lib/personnel-notification-storage';

const VAPID_KEY_STORAGE = 'crewledger-vapid-public-key';
const SW_READY_MAX_ATTEMPTS = 12;
const SW_READY_DELAY_MS = 500;

export type PushSubscriptionStatus = {
  subscribed: boolean;
  currentSessionSubscribed: boolean;
};

function urlBase64ToUint8Array(base64String: string) {
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

async function delay(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Service worker kaydı tamamlanana kadar bekle */
async function ensureServiceWorkerReady() {
  if (!('serviceWorker' in navigator)) return null;

  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing?.active) return existing;

  for (let attempt = 0; attempt < SW_READY_MAX_ATTEMPTS; attempt += 1) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) return registration;
    } catch {
      /* retry */
    }
    await delay(SW_READY_DELAY_MS);
  }

  return navigator.serviceWorker.getRegistration('/').catch(() => null);
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

export async function fetchPushSubscriptionStatus(): Promise<PushSubscriptionStatus | null> {
  try {
    const res = await fetch('/api/personnel/push/status', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      subscribed?: boolean;
      currentSessionSubscribed?: boolean;
    };
    return {
      subscribed: data.subscribed === true,
      currentSessionSubscribed: data.currentSessionSubscribed === true,
    };
  } catch {
    return null;
  }
}

export async function hasLocalPushSubscription(): Promise<boolean> {
  if (!pushSupported()) return false;
  try {
    const registration = await ensureServiceWorkerReady();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * TWA: Android uygulama ayarlarından bildirim açılsa bile WebView izni ayrı kalır.
 * requestPermission() OS izniyle senkronize eder; ayarlardan dönünce mutlaka çağrılmalı.
 */
export async function syncNotificationPermissionForPush(options?: {
  twaAfterSettings?: boolean;
}): Promise<NotificationPermission | 'unsupported'> {
  const current = getNotificationPermission();
  if (current === 'granted' || current === 'unsupported') return current;

  const retryFromSettings = Boolean(options?.twaAfterSettings && isPersonnelTwaRuntime());
  if (current === 'denied' && !retryFromSettings) return current;

  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.warn('[push] Notification.requestPermission failed', error);
    return getNotificationPermission();
  }
}

/** @deprecated syncNotificationPermissionForPush kullanın */
export function canAttemptPushSubscribe(options?: { twaBypassPermission?: boolean }) {
  const permission = getNotificationPermission();
  if (permission === 'granted') return true;
  if (permission === 'unsupported') return false;
  if (permission === 'denied') {
    return Boolean(options?.twaBypassPermission && isPersonnelTwaRuntime());
  }
  return Boolean(options?.twaBypassPermission && isPersonnelTwaRuntime());
}

export async function subscribePersonnelPush(options?: {
  force?: boolean;
  twaBypassPermission?: boolean;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!pushSupported()) return false;

  const twaBypass = Boolean(options?.twaBypassPermission && isPersonnelTwaRuntime());
  const permission = await syncNotificationPermissionForPush({ twaAfterSettings: twaBypass });
  if (permission !== 'granted') {
    console.warn('[push] notification permission not granted:', permission);
    return false;
  }

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) {
    console.warn('[push] VAPID not configured');
    return false;
  }

  const registration = await ensureServiceWorkerReady();
  if (!registration) {
    console.warn('[push] Service worker not ready');
    return false;
  }

  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  const storedVapidKey = localStorage.getItem(VAPID_KEY_STORAGE);
  const vapidRotated = storedVapidKey !== null && storedVapidKey !== publicKey;
  const serverStatus = options?.force ? null : await fetchPushSubscriptionStatus();
  const forceRefresh =
    options?.force === true ||
    vapidRotated ||
    serverStatus?.currentSessionSubscribed === false ||
    serverStatus === null;

  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const existingKey = subscription.options?.applicationServerKey ?? null;
    const keyMismatch = !keyBuffersMatch(existingKey, applicationServerKey);
    if (forceRefresh || keyMismatch) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }

  try {
    subscription =
      subscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      }));
  } catch (error) {
    console.warn('[push] pushManager.subscribe failed', error);
    return false;
  }

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

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    console.warn('[push] subscribe API failed', res.status, data.error ?? res.statusText);
    return false;
  }

  localStorage.setItem(VAPID_KEY_STORAGE, publicKey);
  markNotificationsUnlocked();
  return true;
}

/** Oturum + PIN kilidi açıkken push aboneliğini sunucuya kaydet */
export async function registerPersonnelPushIfAuthed(options?: {
  force?: boolean;
  twaBypassPermission?: boolean;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!pushSupported()) return false;

  try {
    const me = await fetch('/api/personnel/me', { credentials: 'include', cache: 'no-store' });
    if (!me.ok) return false;
  } catch {
    return false;
  }

  const twaBypass = Boolean(options?.twaBypassPermission || isPersonnelTwaRuntime());

  return subscribePersonnelPush({
    force: options?.force,
    twaBypassPermission: twaBypass,
  });
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/** Tarayıcı bildirim izni */
export async function requestNotificationPermission(options?: {
  twaAfterSettings?: boolean;
}): Promise<NotificationPermission | 'unsupported'> {
  return syncNotificationPermissionForPush(options);
}
