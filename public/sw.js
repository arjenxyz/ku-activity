const CACHE_NAME = 'arjendev-v2';
const PRECACHE_URLS = ['/', '/admin-panel/login', '/personnel-panel/login'];

function shouldSkip(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return true;
  if (request.method !== 'GET') return true;
  if (url.pathname.startsWith('/api/')) return true;
  if (url.pathname.startsWith('/_next/')) return true;
  if (url.pathname.startsWith('/__nextjs')) return true;
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) return true;
  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => undefined)
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (shouldSkip(event.request)) return;

  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || caches.match('/') || Response.error();
      })
  );
});
