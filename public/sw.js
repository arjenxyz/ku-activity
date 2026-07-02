const CACHE_NAME = 'crewledger-v6';

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
  event.waitUntil(self.skipWaiting());
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
