const CACHE_NAME = 'hole-in-one-cache-v1';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'icon.svg',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'components/GameCanvas.tsx',
  'components/Header.tsx',
  'components/ControlPanel.tsx',
  'components/HighScoreModal.tsx',
  'components/LeaderboardModal.tsx',
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Use a separate addAll for local assets, and optionally add remote assets individually
        // to avoid the entire cache operation failing if one remote asset fails.
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache urls:', err);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response from cache
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          (networkResponse) => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
               // Don't cache opaque responses (from CDNs without CORS)
               if(networkResponse.type !== 'opaque') {
                 // console.log('FETCH: Not caching', event.request.url);
               }
            }
            return networkResponse;
          }
        );
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});