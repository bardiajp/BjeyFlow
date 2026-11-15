const CACHE = 'bjeyflow-offline-v1';
const OFFLINE_ASSETS = ['/offline.html', '/offline.css', '/offline.js', '/images/ball.svg'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll(OFFLINE_ASSETS))
            .then(() => self.skipWaiting())
    );
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
            .then(() => self.clients.claim())
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

self.addEventListener('push', (event) => {
    if (!event.data) return;
    const payload = event.data.json();
    const url = new URL(payload.url, self.location.origin);
    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: '/icons/notification.png',
            badge: '/icons/notification.png',
            tag: payload.tag,
            data: { url: url.origin === self.location.origin ? url.href : self.location.origin },
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        (async () => {
            const target = event.notification.data.url;
            const windows = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });
            const existing = windows.find(
                (client) => new URL(client.url).origin === self.location.origin
            );
            if (existing) {
                await existing.navigate(target);
                return existing.focus();
            }
            return self.clients.openWindow(target);
        })()
    );
});
