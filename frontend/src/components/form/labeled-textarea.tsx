import { useId, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { FieldFrame } from './field-frame';

export function LabeledTextarea({
    label,
    error,
    description,
    id,
    className,
    containerClassName,
    'aria-describedby': describedBy,
    'aria-invalid': invalid,
    ...props
}: ComponentProps<'textarea'> & {
    label: string;
    error?: string;
    description?: string;
    containerClassName?: string;
}) {
    const generated = useId();
    const inputId = id ?? generated;
    const messages =
        [
            describedBy,
            description ? `${inputId}-description` : undefined,
            error ? `${inputId}-error` : undefined,
        ]
            .filter(Boolean)
            .join(' ') || undefined;
    return (
        <FieldFrame
            id={inputId}
            label={label}
            required={props.required}
            error={error}
            description={description}
            containerClassName={containerClassName}
            variant="textarea"
        >
            <textarea
                {...props}
                id={inputId}
                aria-invalid={error ? true : invalid}
                aria-describedby={messages}
                className={cn(
                    'min-h-24 w-full resize-y px-4 text-sm outline-none disabled:opacity-50',
                    className,
                    'rounded-[10px] border-0 bg-transparent py-2'
                )}
            />
        </FieldFrame>
    );
}
