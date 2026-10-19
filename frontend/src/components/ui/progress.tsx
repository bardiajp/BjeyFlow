import { cn } from '@/lib/utils';

export function Progress({
    value,
    max = 100,
    label,
    className,
}: {
    value: number;
    max?: number;
    label: string;
    className?: string;
}) {
    const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            className={cn('h-1.5 overflow-hidden rounded-full bg-neutral-200', className)}
        >
            <div
                className="bg-primary h-full rounded-full transition-[width] motion-reduce:transition-none"
                style={{ width: `${percent}%` }}
            />
        </div>
    );
}
