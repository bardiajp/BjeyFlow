const CACHE = 'bjeyflow-offline-v1';
const OFFLINE_ASSETS = ['/offline.html', '/offline.css', '/offline.js', '/images/ball.svg'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_ASSETS)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key.startsWith('bjeyflow-offline-') && key !== CACHE)
                        .map((key) => caches.delete(key))
                )
            )
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;

    if (request.mode === 'navigate' && !/^\/(api|users|static)(\/|$)/.test(url.pathname)) {
        event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
    } else if (OFFLINE_ASSETS.includes(url.pathname)) {
        event.respondWith(fetch(request).catch(() => caches.match(request)));
    }
});
