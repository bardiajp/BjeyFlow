import { useId, type ComponentProps } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldFrame } from './field-frame';

export function LabeledSelect({
    label,
    error,
    description,
    id,
    className,
    children,
    containerClassName,
    'aria-describedby': describedBy,
    'aria-invalid': invalid,
    ...props
}: ComponentProps<'select'> & {
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
            variant="dropdown"
        >
            <select
                {...props}
                id={inputId}
                aria-invalid={error ? true : invalid}
                aria-describedby={messages}
                className={cn(
                    'h-10 w-full min-w-0 appearance-none px-4 pr-12 text-base font-medium outline-none disabled:opacity-50',
                    className,
                    'min-h-10 rounded-[10px] border-0 bg-transparent py-2'
                )}
            >
                {children}
            </select>
            <ChevronDown
                size={20}
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
            />
        </FieldFrame>
    );
}
