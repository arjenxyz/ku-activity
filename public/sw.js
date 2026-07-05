const CACHE_NAME = 'crewledger-v17';
/** Manifest ile aynı 192px ikon — büyük PNG Android’de varsayılan zile düşer */
const PUSH_ICON_PATH = '/icons/personnel/192';
const PUSH_ICON_VERSION = '11';

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
  const options = {
    body: payload.body,
    icon: iconUrl,
    tag: payload.notificationId || 'crewledger-notification',
    renotify: true,
    data: { href: payload.href || '/personnel-panel', notificationId: payload.notificationId },
    vibrate: [100, 50, 100],
  };
  try {
    await self.registration.showNotification(payload.title, options);
  } catch {
    await self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: options.tag,
      renotify: true,
      data: options.data,
      vibrate: options.vibrate,
    });
  }
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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(pushIconUrl).catch(() => undefined))
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

      for (const client of clients) {
        if (client.url.includes('/personnel-panel')) {
          client.postMessage({ type: 'crewledger-notifications-refresh' });
        }
      }
    })()
  );
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
