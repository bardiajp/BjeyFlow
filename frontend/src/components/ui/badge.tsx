import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Badge({
    className,
    variant = 'default',
    ...props
}: ComponentProps<'span'> & {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}) {
    return (
        <span
            data-slot="badge"
            data-variant={variant}
            className={cn(
                'inline-flex items-center rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium',
                {
                    'bg-primary text-primary-foreground': variant === 'default',
                    'bg-muted text-muted-foreground': variant === 'secondary',
                    'bg-destructive/10 text-destructive': variant === 'destructive',
                    'border-border text-foreground': variant === 'outline',
                },
                className
            )}
            {...props}
        />
    );
}
