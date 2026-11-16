import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import Loading from '@/components/loading';

const buttonVariants = cva(
    'flow-control inline-flex items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium outline-none select-none disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-[#023047]',
                outline: 'border border-input bg-background',
                ghost: '',
                cancel: 'border border-input bg-background',
                destructive:
                    'border-secondary bg-secondary/10 hover:bg-secondary/20 [&_svg]:text-secondary',
            },
            size: {
                default: 'h-9 px-4',
                sm: 'h-7 px-3',
                lg: 'h-10 px-6',
                'icon-sm': 'size-7',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

function Button({
    className,
    variant = 'default',
    size = 'default',
    disabled,
    isPending,
    children,
    ...props
}: ButtonPrimitive.Props &
    VariantProps<typeof buttonVariants> & {
        disabled?: boolean;
        isPending?: boolean;
    }) {
    return (
        <ButtonPrimitive
            data-slot="button"
            className={cn('text-button-foreground', buttonVariants({ variant, size }), className)}
            disabled={disabled || isPending}
            aria-busy={isPending || undefined}
            {...props}
        >
            {isPending && <Loading className="mr-2" />}
            {children}
        </ButtonPrimitive>
    );
}

export { Button };
