const CACHE_NAME = 'mlm-platform-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/network',
  '/dashboard/earnings',
  '/dashboard/wallet'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

