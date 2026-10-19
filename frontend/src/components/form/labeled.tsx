import { useId, type ComponentProps, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type LabeledInputProps = ComponentProps<typeof Input> & {
    label: ReactNode;
    description?: string;
    error?: string;
    isInvalid?: boolean;
    containerClassName?: string;
};

export function LabeledInput({
    label,
    description,
    error,
    isInvalid,
    containerClassName,
    id,
    required,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: LabeledInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;
    const describedBy =
        [ariaDescribedBy, description ? descriptionId : undefined, error ? errorId : undefined]
            .filter(Boolean)
            .join(' ') || undefined;

    return (
        <div data-slot="labeled-input" className={cn('grid gap-2', containerClassName)}>
            <Label htmlFor={inputId}>
                {label}
                {required && (
                    <span aria-hidden="true" className="text-destructive ml-1">
                        *
                    </span>
                )}
            </Label>
            <Input
                {...props}
                id={inputId}
                required={required}
                aria-invalid={error ? true : (isInvalid ?? ariaInvalid)}
                aria-describedby={describedBy}
            />
            {description && (
                <p id={descriptionId} className="text-muted-foreground text-xs">
                    {description}
                </p>
            )}
            {error && (
                <p
                    id={errorId}
                    data-slot="field-error"
                    role="alert"
                    className="text-destructive text-xs"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
