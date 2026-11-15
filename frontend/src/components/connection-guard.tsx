import { useEffect, useState, type ReactNode } from 'react';
import ErrorState from './error-state';

export function ConnectionGuard({ children }: { children: ReactNode }) {
    const [online, setOnline] = useState(() => navigator.onLine);
    useEffect(() => {
        const update = () => setOnline(navigator.onLine);
        window.addEventListener('online', update);
        window.addEventListener('offline', update);
        return () => {
            window.removeEventListener('online', update);
            window.removeEventListener('offline', update);
        };
    }, []);
    return (
        <>
            <div hidden={!online}>{children}</div>
            {!online && (
                <ErrorState kind="offline" fullPage onRetry={() => setOnline(navigator.onLine)} />
            )}
        </>
    );
}
