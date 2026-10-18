import { cn } from '@/lib/utils';

export default function Loading({ className }: { className?: string }) {
    return (
        <span
            role="status"
            className={cn(
                'inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent',
                className
            )}
        >
            <span className="sr-only">Loading…</span>
        </span>
    );
}
