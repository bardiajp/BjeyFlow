import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function FormActions({ className, ...props }: ComponentProps<'div'>) {
    return <div className={cn('flex flex-wrap items-center justify-end gap-2', className)} {...props} />;
}
