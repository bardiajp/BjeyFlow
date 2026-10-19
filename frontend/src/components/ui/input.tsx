import { Input as InputPrimitive } from '@base-ui/react/input';
import * as React from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const input = (
        <InputPrimitive
            type={isPassword && showPassword ? 'text' : type}
            data-slot="input"
            className={cn(
                'hover:border-primary border placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary h-8 w-full rounded-lg bg-transparent px-4 py-1 text-xs font-medium transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50',
                className,
                isPassword && 'pr-10'
            )}
            {...props}
        />
    );
    if (!isPassword) return input;
    return (
        <div className="relative">
            {input}
            <button
                type="button"
                disabled={props.disabled}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                onClick={() => setShowPassword((visible) => !visible)}
            >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
        </div>
    );
}

export { Input };
