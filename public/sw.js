const CACHE_NAME = 'crewledger-v26';
/** Sağdaki büyük bildirim ikonu */
const PUSH_ICON_PATH = '/personel-icon.png';
/** Soldaki küçük ikon — crewledger silüeti (beyaz, şeffaf) */
const PUSH_BADGE_PATH = '/icons/personnel/notification/96';
const PUSH_ICON_VERSION = '19';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function resubscribeAfterPushSubscriptionChange() {
  try {
    const keyRes = await fetch('/api/personnel/push/vapid-public-key', { credentials: 'include' });
    if (!keyRes.ok) return;
    const keyData = await keyRes.json();
    if (!keyData.enabled || !keyData.publicKey) return;

    const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);
    const registration = self.registration;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      try {
        await existing.unsubscribe();
      } catch {
        /* */
      }
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
    const json = subscription.toJSON();
    await fetch('/api/personnel/push/subscribe', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    });
  } catch {
    /* FCM abonelik yenilemesi — oturum yoksa bir sonraki uygulama açılışında bootstrap tamamlar */
  }
}

function isFocusedPersonnelClient(client) {
  try {
    const path = new URL(client.url).pathname;
    if (!path.startsWith('/personnel-panel')) return false;
    if (path.startsWith('/personnel-panel/login')) return false;
    if (path.startsWith('/personnel-panel/basvuru')) return false;
    if (path.startsWith('/personnel-panel/pin-sifirla')) return false;
    if (path.startsWith('/personnel-panel/sifremi-unuttum')) return false;
    return client.visibilityState === 'visible';
  } catch {
    return false;
  }
}

async function showPushNotification(payload, iconUrl) {
  const origin = self.location.origin;
  const resolvedIcon =
    iconUrl || new URL(`${PUSH_ICON_PATH}?v=${PUSH_ICON_VERSION}`, origin).href;
  const resolvedBadge = new URL(`${PUSH_BADGE_PATH}?v=${PUSH_ICON_VERSION}`, origin).href;
  const options = {
    body: payload.body,
    icon: resolvedIcon,
    badge: resolvedBadge,
    tag: payload.notificationId || 'crewledger-notification',
    renotify: true,
    // Tarayıcılar şu an yok sayıyor; ileride destek gelirse bip kullanılır
    sound: new URL('/bip.mp3', origin).href,
    data: { href: payload.href || '/personnel-panel', notificationId: payload.notificationId },
    vibrate: [100, 50, 100],
  };
  await self.registration.showNotification(payload.title, options);
}

/** Oturum / panel sayfaları asla önbellekten sunulmaz — her açılışta sunucu cookie kontrol eder */
const NETWORK_ONLY_PREFIXES = [
  '/personnel-panel',
  '/admin-panel',
  '/developer-panel',
  '/api/',
];

function shouldSkip(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return true;
  if (request.method !== 'GET') return true;
  if (url.pathname.startsWith('/_next/')) return true;
  if (url.pathname.startsWith('/__nextjs')) return true;
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) return true;
  return false;
}

function isNetworkOnly(url) {
  return NETWORK_ONLY_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

self.addEventListener('install', (event) => {
  const pushIconUrl = new URL(`${PUSH_ICON_PATH}?v=${PUSH_ICON_VERSION}`, self.location.origin).href;
  const pushBadgeUrl = new URL(`${PUSH_BADGE_PATH}?v=${PUSH_ICON_VERSION}`, self.location.origin).href;
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        Promise.all([
          cache.add(pushIconUrl).catch(() => undefined),
          cache.add(pushBadgeUrl).catch(() => undefined),
        ])
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (shouldSkip(event.request)) return;
  if (event.request.mode !== 'navigate') return;

  const url = new URL(event.request.url);

  if (isNetworkOnly(url)) {
    event.respondWith(
      fetch(event.request, { credentials: 'include', cache: 'no-store' })
    );
    return;
  }

  event.respondWith(
    fetch(event.request, { credentials: 'include' })
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || Response.error();
      })
  );
});

self.addEventListener('push', (event) => {
  let payload = { title: 'CrewLedger Personel', body: 'Yeni bir bildiriminiz var.', href: '/personnel-panel', notificationId: null };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* */
  }

  event.waitUntil(
    (async () => {
      const iconUrl = new URL(`${PUSH_ICON_PATH}?v=${PUSH_ICON_VERSION}`, self.location.origin).href;
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      // Her zaman sistem bildirimi — TWA/APK ön planda iken eski kod showNotification atlıyordu
      await showPushNotification(payload, iconUrl);

      const focusedClients = clients.filter(isFocusedPersonnelClient);
      for (const client of focusedClients) {
        client.postMessage({
          type: 'crewledger-in-app-notification',
          notification: {
            id: payload.notificationId,
            title: payload.title,
            body: payload.body,
            href: payload.href || '/personnel-panel',
          },
        });
      }

      // Özel ses: SW Audio çalamaz; arka planda açık sekme varsa bip oradan çalınır.
      // Ön plandaki istemciler toast ile zaten ses çıkarır — çift bip olmasın.
      for (const client of clients) {
        if (!client.url.includes('/personnel-panel')) continue;
        if (isFocusedPersonnelClient(client)) continue;
        client.postMessage({ type: 'crewledger-play-notification-sound' });
      }

      for (const client of clients) {
        if (client.url.includes('/personnel-panel')) {
          client.postMessage({ type: 'crewledger-notifications-refresh' });
        }
      }
    })()
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(resubscribeAfterPushSubscriptionChange());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const href = event.notification.data?.href || '/personnel-panel';
  const url = new URL(href, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.startsWith(self.location.origin)) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
