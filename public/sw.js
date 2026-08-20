const CACHE_NAME = 'parallax-v1';
const MAX_ASSET_CACHE_SIZE = 50;

const APP_SHELL_URLS = [
  '/',
  '/index.html'
];

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

/**
 * Trim the cache to a maximum number of entries (FIFO eviction).
 */
async function trimCache(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxSize) {
    const excess = keys.length - maxSize;
    for (let i = 0; i < excess; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Fetch event - network-first for navigation and hashed assets, with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // For navigation requests, use network-first with cache fallback for offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For CSS and JS assets (hashed by Vite), use network-first so deploys are picked up immediately.
  // Cache the response for offline use and evict old entries to prevent unbounded growth.
  if (request.url.match(/\.(css|js)(\?|$)/)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              trimCache(CACHE_NAME, MAX_ASSET_CACHE_SIZE);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }
});
