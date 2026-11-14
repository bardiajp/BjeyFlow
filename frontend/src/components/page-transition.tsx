import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsFetching, useQueryClient, type Query } from '@tanstack/react-query';

// Only wait for first loads, not background refreshes of existing data.
const initialQueryFilters = {
    predicate: (query: Query) => query.state.status === 'pending',
};

const PageRevealContext = createContext<boolean | undefined>(undefined);

export function PageTransition({
    children,
    waitForAssets = true,
}: {
    children: ReactNode;
    waitForAssets?: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const parentReady = useContext(PageRevealContext);
    // Initially nested content shares its parent's fade. Later route mounts animate themselves.
    const [sharedReveal] = useState(parentReady === false);
    const [ready, setReady] = useState(sharedReveal);
    const queryClient = useQueryClient();
    const initialRequests = useIsFetching(initialQueryFilters);

    useEffect(() => {
        if (ready || initialRequests > 0) return;
        let cancelled = false;
        let revealFrame: number | undefined;
        // Let child queries mount and data-dependent content render before checking assets.
        const frame = requestAnimationFrame(() => {
            const images = Array.from(ref.current?.querySelectorAll('img') ?? []);
            const assets = waitForAssets
                ? [document.fonts.ready, ...images.map((image) => image.decode())]
                : [];
            void Promise.allSettled(assets).then(() => {
                if (cancelled) return;
                revealFrame = requestAnimationFrame(() => {
                    if (!cancelled && queryClient.isFetching(initialQueryFilters) === 0) {
                        setReady(true);
                    }
                });
            });
        });
        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            if (revealFrame !== undefined) cancelAnimationFrame(revealFrame);
        };
    }, [initialRequests, queryClient, ready, waitForAssets]);

    return (
        <PageRevealContext.Provider value={ready && parentReady !== false}>
            <div
                ref={ref}
                className={ready ? (sharedReveal ? undefined : 'page-fade-in') : 'opacity-0'}
                inert={!ready}
                aria-busy={!ready}
            >
                {children}
            </div>
        </PageRevealContext.Provider>
    );
}
