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
    let payload;
    try {
        payload = event.data.json();
    } catch {
        payload = {};
    }
    if (!payload || typeof payload !== 'object') payload = {};
    let url;
    try {
        url = new URL(payload.url || '/', self.location.origin);
    } catch {
        url = new URL('/', self.location.origin);
    }
    let image;
    try {
        if (payload.image) {
            const imageUrl = new URL(payload.image, self.location.origin);
            if (imageUrl.origin === self.location.origin) image = imageUrl.href;
        }
    } catch {
        // An invalid image must not prevent the notification from being shown.
    }
    event.waitUntil(
        Promise.all([self.registration.showNotification(payload.title || 'BjeyFlow', {
            body: payload.body || 'Open BjeyFlow for an update.',
            icon: '/icons/notification.png',
            badge: '/icons/notification.png',
            ...(image ? { image } : {}),
            tag: payload.tag,
            data: { url: url.origin === self.location.origin ? url.href : self.location.origin },
        }), self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            const visible = clients.find((client) =>
                client.visibilityState === 'visible' && new URL(client.url).origin === self.location.origin
            );
            if (visible && image) {
                visible.postMessage({
                    type: 'bjeyflow-push',
                    title: payload.title || 'BjeyFlow',
                    body: payload.body || 'Open BjeyFlow for an update.',
                    url: url.origin === self.location.origin ? url.href : self.location.origin,
                    image,
                });
            }
        })])
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        (async () => {
            let target = self.location.origin;
            try {
                const url = new URL(event.notification.data?.url || '/', self.location.origin);
                if (url.origin === self.location.origin) target = url.href;
            } catch {
                // Fall back to the app home page.
            }
            const windows = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });
            const existing = windows.find(
                (client) => new URL(client.url).origin === self.location.origin
            );
            if (existing) {
                const navigated = await existing.navigate(target);
                if (navigated) return navigated.focus();
            }
            return self.clients.openWindow(target);
        })()
    );
});
