'use strict';

const CACHE_PREFIX = 'infernal-city-';
const RELEASE_VERSION = '2.11.0';
const CACHE_NAME = `${CACHE_PREFIX}core-${RELEASE_VERSION}`;
const MEDIA_CACHE_NAME = `${CACHE_PREFIX}media-${RELEASE_VERSION}`;
const MAX_MEDIA_CACHE_ENTRIES = 320;

const EXPANSION_TERRAIN_PATHS = new Set([
  'assets/environment/map-western-wall.webp',
  'assets/environment/map-southern-watch.webp',
  'assets/environment/map-twin-rift.webp'
]);

const ESSENTIAL_PRECACHE_URLS = [
  './index.html',
  './styles.v8.css',
  './audio.v8.js',
  './vn-scenes.v1.js',
  './expansion.v1.js',
  './characters.v1.js',
  './vn-expansion.v1.js',
  './adult-scenes.v1.js',
  './game.v9.js',
  './pwa.v4.js'
];

const OPTIONAL_PRECACHE_URLS = [
  './',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

async function precacheRelease() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(ESSENTIAL_PRECACHE_URLS);

  const optionalResults = await Promise.allSettled(
    OPTIONAL_PRECACHE_URLS.map(async (url) => {
      await cache.add(url);
      return url;
    })
  );
  optionalResults.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`Précache optionnel ignoré : ${OPTIONAL_PRECACHE_URLS[index]}`, result.reason);
    }
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheRelease()
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => (
            cacheName.startsWith(CACHE_PREFIX)
            && cacheName !== CACHE_NAME
            && cacheName !== MEDIA_CACHE_NAME
          ))
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

async function trimMediaCache(cache, maximumEntries = MAX_MEDIA_CACHE_ENTRIES) {
  const keys = await cache.keys();
  const excess = Math.max(0, keys.length - maximumEntries);
  if (!excess) return 0;

  // Cache.keys() preserves insertion order. Cache hits are reinserted below,
  // therefore the first entries are the least recently used ones.
  await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
  return excess;
}

async function storeRuntimeMedia(cache, request, response) {
  await cache.put(request, response);
  await trimMediaCache(cache);
}

async function touchRuntimeMedia(cache, request, response) {
  await cache.delete(request);
  await storeRuntimeMedia(cache, request, response);
}

async function serveRuntimeMedia(request, event) {
  const cache = await caches.open(MEDIA_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    event.waitUntil(
      touchRuntimeMedia(cache, request, cachedResponse.clone())
        .catch((error) => console.warn('Actualisation LRU média impossible.', error))
    );
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse.ok && networkResponse.type === 'basic') {
    event.waitUntil(
      storeRuntimeMedia(cache, request, networkResponse.clone())
        .catch((error) => console.warn('Mise en cache média impossible.', error))
    );
  }
  return networkResponse;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;
  const scopePath = new URL(self.registration.scope).pathname;
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const relativePath = (
    decodedPath.startsWith(scopePath)
      ? decodedPath.slice(scopePath.length)
      : decodedPath
  ).replace(/^\/+/, '');
  const isExpansionTerrain = (
    EXPANSION_TERRAIN_PATHS.has(relativePath)
    || relativePath.startsWith('assets/environment/layouts/')
  );
  const isNarrativeCg = (
    request.destination === 'image'
    && (
      /^assets\/cg_.+\.(?:png|jpe?g|webp)$/i.test(relativePath)
    )
  );
  const isRuntimeMedia = (
    isExpansionTerrain
    || isNarrativeCg
    || relativePath.startsWith('assets/environment/')
    || relativePath.startsWith('assets/animations/')
    || relativePath.startsWith('assets/characters/')
    || relativePath.startsWith('assets/vn/')
  );

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then((cache) => cache.put('./index.html', response.clone()))
            );
          }
          return response;
        })
        .catch(async () => (
          await caches.match('./index.html')
          || await caches.match('./')
          || Response.error()
        ))
    );
    return;
  }

  if (isRuntimeMedia) {
    event.respondWith(
      serveRuntimeMedia(request, event)
        .catch(async () => (
          await caches.match(request)
          || await caches.match(request, { ignoreSearch: true })
          || Response.error()
        ))
    );
    return;
  }

  const isMutableCoreAsset = ['script', 'style', 'worker'].includes(request.destination);
  if (isMutableCoreAsset) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, response.clone()))
            );
          }
          return response;
        })
        .catch(async () => (
          await caches.match(request)
          || await caches.match(request, { ignoreSearch: true })
          || Response.error()
        ))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, response.clone()))
            );
          }
          return response;
        });
      })
  );
});
