'use client';

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

export async function subscribePersonnelPush(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (Notification.permission === 'denied') return false;

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) return false;

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();

  if (permission !== 'granted') return false;

  const registration = await navigator.serviceWorker.ready;
  const applicationServerKey = urlBase64ToUint8Array(publicKey);

  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const existingKey = subscription.options?.applicationServerKey ?? null;
    if (!keyBuffersMatch(existingKey, applicationServerKey)) {
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

  return res.ok;
}

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}
