import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsFetching, useQueryClient, type Query } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import AppLoading from '@/components/app-loading';

// Only wait for first loads, not background refreshes of existing data.
const initialQueryFilters = {
    predicate: (query: Query) => query.state.status === 'pending',
};

const PageRevealContext = createContext<boolean | undefined>(undefined);
let initialPageRevealed = false;

export function PageTransition({
    children,
    waitForAssets = true,
    className,
}: {
    children: ReactNode;
    waitForAssets?: boolean;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const parentReady = useContext(PageRevealContext);
    // Initially nested content shares its parent's fade. Later route mounts animate themselves.
    const [sharedReveal] = useState(parentReady === false);
    const [ready, setReady] = useState(sharedReveal);
    const [loadingStartedAt] = useState(() =>
        initialPageRevealed
            ? performance.now()
            : performance.getEntriesByName('app-loading-start')[0].startTime
    );
    const queryClient = useQueryClient();
    const initialRequests = useIsFetching(initialQueryFilters);

    useEffect(() => {
        if (ready || initialRequests > 0) return;
        let cancelled = false;
        let revealFrame: number | undefined;
        let revealTimer: number | undefined;
        // Let child queries mount and data-dependent content render before checking assets.
        const frame = requestAnimationFrame(() => {
            const images = Array.from(ref.current?.querySelectorAll('img') ?? []);
            const assets = waitForAssets
                ? [document.fonts.ready, ...images.map((image) => image.decode())]
                : [];
            void Promise.allSettled(assets).then(() => {
                if (cancelled) return;
                revealTimer = window.setTimeout(
                    () => {
                        revealFrame = requestAnimationFrame(() => {
                            if (!cancelled && queryClient.isFetching(initialQueryFilters) === 0) {
                                if (parentReady === undefined) initialPageRevealed = true;
                                setReady(true);
                            }
                        });
                    },
                    parentReady === undefined
                        ? Math.max(0, loadingStartedAt + 2000 - performance.now())
                        : 0
                );
            });
        });
        return () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            if (revealFrame !== undefined) cancelAnimationFrame(revealFrame);
            window.clearTimeout(revealTimer);
        };
    }, [initialRequests, loadingStartedAt, parentReady, queryClient, ready, waitForAssets]);

    return (
        <PageRevealContext.Provider value={ready && parentReady !== false}>
            {parentReady === undefined && !ready && <AppLoading />}
            <div
                ref={ref}
                className={cn(
                    ready ? (sharedReveal ? undefined : 'page-fade-in') : 'opacity-0',
                    className
                )}
                inert={!ready}
                aria-busy={!ready}
            >
                {children}
            </div>
        </PageRevealContext.Provider>
    );
}
