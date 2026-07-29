'use strict';

const CACHE_PREFIX = 'infernal-city-';
const LEGACY_CACHE_NAME = `${CACHE_PREFIX}v8`;
const CACHE_NAME = `${CACHE_PREFIX}v9`;
const MEDIA_CACHE_NAME = `${CACHE_PREFIX}media-v2.4`;

const EXPANSION_TERRAIN_PATHS = new Set([
  'assets/environment/map-western-wall.png',
  'assets/environment/map-southern-watch.png',
  'assets/environment/map-twin-rift.png'
]);

const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.v8.css',
  './audio.v8.js',
  './vn-scenes.v1.js',
  './expansion.v1.js',
  './characters.v1.js',
  './vn-expansion.v1.js',
  './game.v9.js',
  './pwa.v4.js',
  './manifest.webmanifest',
  './assets/cover.jpg',
  './assets/cg_aria.jpg',
  './assets/environment/infernal-city-floor.png',
  './assets/environment/infernal-city-coastline.png',
  './assets/environment/infernal-city-approach-terrain.png',
  './assets/environment/infernal-city-spawn-gate-atlas.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => (
            cacheName === LEGACY_CACHE_NAME
            || (
              cacheName.startsWith(CACHE_PREFIX)
              && cacheName !== CACHE_NAME
              && cacheName !== MEDIA_CACHE_NAME
            )
          ))
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

async function serveRuntimeMedia(request, event) {
  const cache = await caches.open(MEDIA_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse.ok && networkResponse.type === 'basic') {
    event.waitUntil(cache.put(request, networkResponse.clone()));
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
