import { useLayoutEffect } from 'react';
import { finishStartupLoading, isStartupLoadingFinished } from '@/lib/startup-loading-state';
import Loading from '@/components/loading';

let loadingConsumers = 0;
let visibleSince: number | undefined;
let hideTimer: number | undefined;
// A complete left-to-right-and-back wave, with at least two seconds on screen.
const cycleDuration = 2400;

export default function AppLoading() {
    useLayoutEffect(() => {
        if (isStartupLoadingFinished()) return;
        const loading = document.getElementById('app-loading')!;
        window.clearTimeout(hideTimer);
        delete loading.dataset.leaving;
        if (loading.hidden || visibleSince === undefined) {
            visibleSince = loading.hidden
                ? performance.now()
                : (performance.getEntriesByName('app-loading-start')[0]?.startTime ?? performance.now());
        }
        loadingConsumers += 1;
        loading.hidden = false;

        return () => {
            loadingConsumers -= 1;
            queueMicrotask(() => {
                if (loadingConsumers !== 0) return;
                const elapsed = performance.now() - visibleSince!;
                const cycleEnd = Math.max(1, Math.ceil(elapsed / cycleDuration)) * cycleDuration;
                hideTimer = window.setTimeout(() => {
                    if (loadingConsumers !== 0) return;
                    finishStartupLoading();
                    loading.dataset.leaving = 'true';
                    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                        ? 0
                        : 400;
                    hideTimer = window.setTimeout(() => {
                        if (loadingConsumers !== 0) return;
                        loading.hidden = true;
                        delete loading.dataset.leaving;
                        visibleSince = undefined;
                    }, duration);
                }, Math.max(0, cycleEnd - elapsed));
            });
        };
    }, []);

    return isStartupLoadingFinished() ? <Loading /> : null;
}
