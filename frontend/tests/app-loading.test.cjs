const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function startup(theme, systemDark, blocked = false) {
    const root = { style: {}, classList: { toggle: (_, value) => { root.dark = value; } } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/app-loading.js'), 'utf8'), {
        performance: { mark() {} },
        localStorage: { getItem() {
            if (blocked) throw new Error('Blocked');
            return JSON.stringify({ state: { theme } });
        } },
        window: { matchMedia: () => ({ matches: systemDark }) },
        document: { documentElement: root },
    });
    return root;
}

test('loading respects a saved theme before React loads', () => {
    assert.equal(startup('light', true).style.colorScheme, 'light');
    assert.equal(startup('dark', false).style.colorScheme, 'dark');
});

test('system theme and blocked storage fall back safely', () => {
    assert.equal(startup('system', true).dark, true);
    assert.equal(startup('invalid', false).dark, false);
    assert.equal(startup(null, true, true).dark, true);
});

test('startup loading stays finished across SPA mounts but resets for a fresh document', async () => {
    const url = pathToFileURL(path.join(__dirname, '../src/lib/startup-loading-state.ts')).href;
    const firstDocument = await import(`${url}?document=first`);
    assert.equal(firstDocument.isStartupLoadingFinished(), false);
    firstDocument.finishStartupLoading();
    const laterNavigation = await import(`${url}?document=first`);
    assert.equal(laterNavigation.isStartupLoadingFinished(), true);
    laterNavigation.finishStartupLoading();
    assert.equal(laterNavigation.isStartupLoadingFinished(), true);
    const refreshedDocument = await import(`${url}?document=refreshed`);
    assert.equal(refreshedDocument.isStartupLoadingFinished(), false);
});

test('wave movement uses transforms instead of per-frame layout changes', () => {
    const css = fs.readFileSync(path.join(__dirname, '../public/app-loading.css'), 'utf8');
    for (const name of ['loading-water-travel', 'loading-water-impact']) {
        const start = css.indexOf(`@keyframes ${name} {`);
        assert.notEqual(start, -1);
        const end = css.indexOf('\n}', start);
        const keyframes = css.slice(start, end);
        assert.match(keyframes, /transform:/);
        assert.doesNotMatch(keyframes, /(?:left|right|width|height|top|bottom):/);
    }
});
