import { cn } from '@/lib/utils';

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
            <input
                type="checkbox"
                role="switch"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                className="flow-control border-input bg-accent checked:bg-brand focus-visible:ring-primary relative h-6 w-11 shrink-0 appearance-none rounded-full border transition-colors outline-none after:absolute after:top-0.5 after:left-0.5 after:size-[18px] after:rounded-full after:bg-white after:shadow-sm after:transition-transform checked:after:translate-x-5 focus-visible:ring-2"
            />
        </label>
    );
}
