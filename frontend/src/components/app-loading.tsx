import { useLayoutEffect } from 'react';

let loadingConsumers = 0;

export default function AppLoading() {
    useLayoutEffect(() => {
        const loading = document.getElementById('app-loading')!;
        loadingConsumers += 1;
        loading.hidden = false;

        return () => {
            loadingConsumers -= 1;
            queueMicrotask(() => {
                if (loadingConsumers === 0) loading.hidden = true;
            });
        };
    }, []);

    return null;
}
