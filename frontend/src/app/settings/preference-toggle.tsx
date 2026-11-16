import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export function PreferenceToggle({
    label,
    description,
    checked,
    onChange,
    disabled = false,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label
            className={cn(
                'flex items-center justify-between gap-5 py-4',
                disabled ? 'opacity-40' : 'cursor-pointer'
            )}
        >
            <span className="min-w-0">
                <span className="text-foreground block text-[13px] font-medium">{label}</span>
                <span className="text-muted-foreground mt-1 block text-[11px] leading-relaxed">
                    {description}
                </span>
            </span>
            <Checkbox
                variant="switch"
                role="switch"
                checked={checked}
                disabled={disabled}
                onCheckedChange={onChange}
            />
        </label>
    );
}
