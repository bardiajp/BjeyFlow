const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = () => import(pathToFileURL(path.join(__dirname, '../src/lib/push-device.ts')).href);

test('device check waits for worker registration instead of reporting disabled early', async () => {
    const { readPushDevice } = await load();
    let registered;
    const ready = new Promise((resolve) => { registered = resolve; });
    const subscription = { endpoint: 'https://fcm.googleapis.com/test' };
    let settled = false;
    const check = readPushDevice(ready, () => 'granted').then((value) => {
        settled = true;
        return value;
    });
    await Promise.resolve();
    assert.equal(settled, false);
    registered({ pushManager: { getSubscription: async () => subscription } });
    assert.deepEqual(await check, { subscription, permission: 'granted' });
});

test('missing registration reports an error, not a disabled device', async () => {
    const { readPushDevice } = await load();
    await assert.rejects(
        readPushDevice(new Promise(() => {}), () => 'granted', 5),
        /notification service is not ready/
    );
});

test('device inspection never subscribes or requests permission', async () => {
    const { readPushDevice } = await load();
    const result = await readPushDevice(Promise.resolve({
        pushManager: { getSubscription: async () => null },
    }), () => 'denied');
    assert.deepEqual(result, { subscription: null, permission: 'denied' });
});
