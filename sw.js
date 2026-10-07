// Service worker: red primero y copia en caché para funcionar sin conexión
const CACHE_NAME = 'vias-ferratas-v2.1.0';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './src/css/styles.css',
    './src/css/notifications.css',
    './src/js/config.js',
    './src/js/notifications.js',
    './src/js/github.js',
    './src/js/map.js',
    './src/components/ferratas.js',
    './src/components/ascensiones.js',
    './src/js/ui.js',
    './src/js/main.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'unpkg.com', 'raw.githubusercontent.com'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;
    const cacheable = sameOrigin || CDN_HOSTS.some(host => url.hostname.endsWith(host));
    // La API de GitHub nunca se cachea aquí (los datos se guardan aparte en localStorage)
    if (!cacheable) return;

    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok || response.type === 'opaque') {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request).then(cached => cached || Response.error()))
    );
});
