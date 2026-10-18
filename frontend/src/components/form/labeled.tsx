import { useId, type ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LabeledInput({
    label,
    isInvalid,
    id,
    ...props
}: ComponentProps<typeof Input> & {
    label: string;
    isInvalid?: boolean;
}) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
        <div className="grid gap-2">
            <Label htmlFor={inputId}>{label}</Label>
            <Input id={inputId} aria-invalid={isInvalid} {...props} />
        </div>
    );
}
