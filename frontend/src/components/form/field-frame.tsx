import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import './field.css';

export function FieldMessage({
    id,
    error,
    description,
}: {
    id: string;
    error?: string;
    description?: string;
}) {
    const message = error || description;
    if (!message) return null;
    return (
        <div
            key={error ? 'error' : 'description'}
            className="form-field-message"
            data-slot="field-message"
            data-error={!!error}
        >
            <div className="min-h-0 overflow-hidden">
                <div
                    id={id}
                    role={error ? 'alert' : undefined}
                    data-slot={error ? 'field-error' : 'field-description'}
                    className="bg-primary/55 text-muted-foreground mt-0.5 flex items-start gap-2 rounded-[10px] px-4 py-1 text-xs leading-relaxed font-semibold"
                >
                    <CircleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                    <span>{message}</span>
                </div>
            </div>
        </div>
    );
}

export function FieldFrame({
    id,
    label,
    required,
    description,
    error,
    containerClassName,
    controlClassName,
    variant = 'input',
    children,
}: {
    id: string;
    label: ReactNode;
    required?: boolean;
    description?: string;
    error?: string;
    containerClassName?: string;
    controlClassName?: string;
    variant?: 'input' | 'dropdown' | 'date' | 'time' | 'textarea' | 'color';
    children: ReactNode;
}) {
    return (
        <div
            data-slot="labeled-input"
            data-field-variant={variant}
            className={cn('min-w-0 pt-2', containerClassName)}
        >
            <div
                data-slot="field-control"
                className={cn(
                    'border-primary bg-background focus-within:ring-primary/20 relative rounded-xl border p-1 transition-shadow focus-within:ring-2',
                    controlClassName
                )}
            >
                <Label
                    htmlFor={id}
                    className="bg-background text-primary absolute top-0 left-3 z-10 max-w-[calc(100%-1.5rem)] -translate-y-1/2 px-1.5 text-sm leading-none font-medium"
                >
                    {label}
                    {required && (
                        <span aria-hidden="true" className="text-secondary ml-1">
                            *
                        </span>
                    )}
                </Label>
                {children}
            </div>
            {description && error && (
                <p id={`${id}-description`} className="sr-only">
                    {description}
                </p>
            )}
            <FieldMessage
                id={`${id}-${error ? 'error' : 'description'}`}
                error={error}
                description={description}
            />
        </div>
    );
}
