const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function worker() {
    const handlers = {};
    const shown = [];
    const opened = [];
    const self = {
        location: { origin: 'https://bjeyflow.example' },
        addEventListener: (name, handler) => { handlers[name] = handler; },
        registration: { showNotification: async (...args) => { shown.push(args); } },
        clients: {
            matchAll: async () => [],
            openWindow: async (url) => { opened.push(url); },
        },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), {
        self, URL,
    });
    return { handlers, shown, opened };
}

test('push falls back safely for malformed payloads and external URLs', async () => {
    const { handlers, shown } = worker();
    let pending;
    handlers.push({ data: { json: () => { throw new Error('bad json'); } }, waitUntil: (p) => { pending = p; } });
    await pending;
    assert.equal(shown[0][0], 'BjeyFlow');
    assert.equal(shown[0][1].data.url, 'https://bjeyflow.example/');
    handlers.push({ data: { json: () => ({ title: 'Hello', url: 'https://other.example' }) }, waitUntil: (p) => { pending = p; } });
    await pending;
    assert.equal(shown[1][1].data.url, 'https://bjeyflow.example');
});

test('notification clicks without data open the app safely', async () => {
    const { handlers, opened } = worker();
    let pending;
    handlers.notificationclick({ notification: { close() {} }, waitUntil: (p) => { pending = p; } });
    await pending;
    assert.equal(opened[0], 'https://bjeyflow.example/');
});

test('push uses only same-origin notification images', async () => {
    const { handlers, shown } = worker();
    let pending;
    for (const image of ['/images/notification-task-reminder.webp', 'https://other.example/image.webp']) {
        handlers.push({
            data: { json: () => ({ image }) },
            waitUntil: (promise) => { pending = promise; },
        });
        await pending;
    }
    assert.equal(shown[0][1].image, 'https://bjeyflow.example/images/notification-task-reminder.webp');
    assert.equal(shown[1][1].image, undefined);
});

test('push also reaches one visible app window', async () => {
    const { handlers } = worker();
    const messages = [];
    // The worker's client list can be supplied before dispatch in the browser;
    // use a dedicated worker context here to exercise that path.
    const listeners = {};
    const self = {
        location: { origin: 'https://bjeyflow.example' },
        addEventListener: (name, handler) => { listeners[name] = handler; },
        registration: { showNotification: async () => {} },
        clients: { matchAll: async () => [
            { url: 'https://bjeyflow.example/today', visibilityState: 'visible', postMessage: (value) => messages.push(value) },
        ] },
    };
    assert.ok(handlers.push);
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), { self, URL });
    let pending;
    listeners.push({
        data: { json: () => ({ title: 'Hello', image: '/images/notification-test.webp', url: '/today' }) },
        waitUntil: (promise) => { pending = promise; },
    });
    await pending;
    assert.equal(messages[0].type, 'bjeyflow-push');
    assert.equal(messages[0].url, 'https://bjeyflow.example/today');
});
