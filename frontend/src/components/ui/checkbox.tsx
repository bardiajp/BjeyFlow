import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function Checkbox({
    className,
    variant = 'default',
    children,
    ...props
}: CheckboxPrimitive.Root.Props & {
    variant?: 'default' | 'task' | 'switch';
}) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                'group focus-visible:ring-primary/35 relative inline-flex shrink-0 items-center justify-center transition-[background-color,border-color,box-shadow] duration-200 outline-none after:absolute after:-inset-2 focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
                variant === 'default' &&
                    'border-input bg-card hover:border-primary/70 data-checked:border-brand data-checked:bg-brand size-5 rounded-[7px] border shadow-[0_1px_3px_#02304712] data-checked:text-white',
                variant === 'task' &&
                    'border-primary size-6 rounded-full border disabled:opacity-100',
                variant === 'switch' &&
                    'border-input bg-accent data-checked:bg-brand h-6 w-11 rounded-full border',
                className
            )}
            {...props}
        >
            {variant === 'default' && (
                <CheckboxPrimitive.Indicator className="grid place-content-center transition-transform duration-200 data-ending-style:scale-50 data-starting-style:scale-50 motion-reduce:transition-none">
                    <Check className="size-3.5" strokeWidth={2.6} />
                </CheckboxPrimitive.Indicator>
            )}
            {variant === 'switch' && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0.5 size-[18px] rounded-full bg-[#ffffff] shadow-sm transition-transform duration-200 group-data-checked:translate-x-5 motion-reduce:transition-none"
                />
            )}
            {children}
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
