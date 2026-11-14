import { useId, useState, type Ref } from 'react';
import { Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FieldFrame } from './field-frame';

const presets = [
    { value: '#8ECAE6', label: 'Sky' },
    { value: '#FB8500', label: 'Orange' },
    { value: '#696969', label: 'Gray' },
    { value: '#023047', label: 'Navy' },
    { value: '#90BE6D', label: 'Green' },
    { value: '#B8A1D9', label: 'Lavender' },
];

function canonicalColor(value: string) {
    const match = value.trim().match(/^#?([0-9a-f]{6})$/i);
    return match ? `#${match[1].toUpperCase()}` : null;
}

export type ColorInputProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    ref?: Ref<HTMLInputElement>;
    name?: string;
    id?: string;
    disabled?: boolean;
    error?: string;
    description?: string;
    containerClassName?: string;
};

export function ColorInput({
    label,
    value,
    onChange,
    onBlur,
    ref,
    name,
    id,
    disabled,
    error,
    description,
    containerClassName,
}: ColorInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const selected = canonicalColor(value);
    const [lastValid, setLastValid] = useState(selected ?? '#8ECAE6');
    const preview = selected ?? lastValid;
    const describedBy =
        [description ? `${inputId}-description` : undefined, error ? `${inputId}-error` : undefined]
            .filter(Boolean)
            .join(' ') || undefined;
    const choose = (color: string) => {
        setLastValid(color);
        onChange(color);
        onBlur?.();
    };

    return (
        <div dir="ltr" className={cn('grid min-w-0 gap-3', containerClassName)}>
            <span className="text-sm font-medium" id={`${inputId}-presets-label`}>
                {label}
            </span>
            <div
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                role="group"
                aria-labelledby={`${inputId}-presets-label`}
            >
                {presets.map((color) => (
                    <button
                        key={color.value}
                        type="button"
                        aria-label={`Use ${color.label} color`}
                        aria-pressed={selected === color.value}
                        disabled={disabled}
                        title={`${color.label} · ${color.value}`}
                        onClick={() => choose(color.value)}
                        className="flow-control group focus-visible:ring-primary rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Badge
                            variant="outline"
                            className={cn(
                                'text-primary-foreground flex h-10 w-full gap-2 border-neutral-200 bg-white px-3 text-xs transition-colors',
                                selected === color.value && 'border-primary bg-primary/25'
                            )}
                        >
                            <span
                                className="size-3.5 shrink-0 rounded-full border border-black/10"
                                style={{ backgroundColor: color.value }}
                                aria-hidden="true"
                            />
                            <span className="truncate">{color.label}</span>
                            {selected === color.value && (
                                <Check
                                    size={15}
                                    strokeWidth={2.5}
                                    aria-hidden="true"
                                    className="ml-auto shrink-0"
                                />
                            )}
                        </Badge>
                    </button>
                ))}
            </div>
            <FieldFrame
                id={inputId}
                label="Custom color"
                error={error}
                description={description}
                variant="color"
                controlClassName="h-12"
            >
                <div className="flex h-full min-h-0 items-center gap-2 px-2 py-1 sm:gap-3 sm:px-3">
                    <span className="focus-within:ring-primary relative block size-6 shrink-0 overflow-hidden rounded-md border border-black/10 focus-within:ring-2 focus-within:ring-offset-2 sm:size-8">
                        <span
                            aria-hidden="true"
                            className="absolute inset-0"
                            style={{ backgroundColor: preview }}
                        />
                        <input
                            type="color"
                            value={preview}
                            disabled={disabled}
                            aria-label={`${label} picker`}
                            aria-describedby={describedBy}
                            aria-invalid={!!error}
                            onChange={(event) => choose(event.target.value.toUpperCase())}
                            className="absolute inset-0 h-full w-full opacity-0 disabled:cursor-not-allowed"
                            title="Choose a custom color"
                        />
                    </span>
                    <Input
                        ref={ref}
                        id={inputId}
                        name={name}
                        value={value}
                        disabled={disabled}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        maxLength={7}
                        aria-label={`${label} hex value`}
                        aria-describedby={describedBy}
                        aria-invalid={!!error}
                        placeholder="#8ECAE6"
                        className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 font-mono text-sm font-medium tracking-wide uppercase focus-visible:ring-0"
                        onChange={(event) => {
                            const next = event.target.value;
                            setLastValid(canonicalColor(next) ?? selected ?? lastValid);
                            onChange(next);
                        }}
                        onBlur={() => {
                            const normalized = canonicalColor(value);
                            if (normalized) onChange(normalized);
                            onBlur?.();
                        }}
                    />
                    <span
                        aria-hidden="true"
                        className="text-muted-foreground hidden text-[10px] font-medium tracking-wider sm:inline"
                    >
                        HEX
                    </span>
                </div>
            </FieldFrame>
        </div>
    );
}
