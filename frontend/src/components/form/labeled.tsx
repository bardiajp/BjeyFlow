import { useId, type ComponentProps, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FieldFrame } from './field-frame';

export type LabeledInputProps = ComponentProps<typeof Input> & {
    label: ReactNode;
    description?: string;
    error?: string;
    isInvalid?: boolean;
    containerClassName?: string;
    variant?: 'input' | 'date' | 'time';
};

export function LabeledInput({
    label,
    description,
    error,
    isInvalid,
    containerClassName,
    id,
    required,
    type,
    variant = 'input',
    className,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
}: LabeledInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const inputType = variant === 'date' || variant === 'time' ? variant : type;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;
    const describedBy =
        [ariaDescribedBy, description ? descriptionId : undefined, error ? errorId : undefined]
            .filter(Boolean)
            .join(' ') || undefined;

    return (
        <FieldFrame
            id={inputId}
            label={label}
            required={required}
            description={description}
            error={error}
            containerClassName={containerClassName}
            variant={inputType === 'date' ? 'date' : inputType === 'time' ? 'time' : 'input'}
        >
            <Input
                {...props}
                id={inputId}
                type={inputType}
                className={cn(
                    'h-10 w-full px-4 text-base font-medium shadow-none',
                    className,
                    'min-h-10 rounded-[10px] border-0 bg-transparent py-2 outline-none focus-visible:ring-0'
                )}
                required={required}
                aria-invalid={error ? true : (isInvalid ?? ariaInvalid)}
                aria-describedby={describedBy}
            />
        </FieldFrame>
    );
}
