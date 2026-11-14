import { Select } from '@base-ui/react/select';
import { Check, ChevronDown, ListFilter } from 'lucide-react';
import { useId, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/utils';
import { FieldFrame } from './field-frame';

export interface SelectOption {
    value: string;
    label: string;
    icon?: ReactNode;
    description?: string;
    disabled?: boolean;
}

export function LabeledSelect({
    label,
    value,
    onValueChange,
    options,
    name,
    onBlur,
    ref,
    error,
    description,
    disabled,
    required,
    id,
    containerClassName,
    className,
    placeholder = 'Choose an option',
}: {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    name?: string;
    onBlur?: () => void;
    ref?: Ref<HTMLButtonElement>;
    error?: string;
    description?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    containerClassName?: string;
    className?: string;
    placeholder?: string;
}) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const selected = options.find((option) => option.value === value);
    const messageId = error
        ? `${inputId}-error`
        : description
          ? `${inputId}-description`
          : undefined;
    return (
        <FieldFrame
            id={inputId}
            label={label}
            required={required}
            error={error}
            description={description}
            containerClassName={containerClassName}
            variant="dropdown"
        >
            <Select.Root<string>
                value={value || null}
                items={options}
                onValueChange={(next) => {
                    if (next !== null) onValueChange(next);
                }}
                name={name}
                disabled={disabled}
                required={required}
            >
                <Select.Trigger
                    ref={ref}
                    id={inputId}
                    onBlur={onBlur}
                    aria-invalid={!!error}
                    aria-describedby={messageId}
                    className={cn(
                        'group text-primary-foreground flex h-11 w-full min-w-0 items-center gap-2.5 rounded-[10px] border-0 bg-transparent px-3 text-left text-sm font-normal outline-none disabled:cursor-not-allowed disabled:opacity-50',
                        className
                    )}
                >
                    <span className="bg-primary/10 text-primary-foreground/70 flex size-7 shrink-0 items-center justify-center rounded-lg">
                        {selected?.icon ?? <ListFilter size={15} />}
                    </span>
                    <Select.Value
                        placeholder={placeholder}
                        className="min-w-0 flex-1 truncate data-placeholder:text-slate-400"
                    />
                    <Select.Icon>
                        <ChevronDown
                            size={15}
                            className="text-slate-400 transition-transform duration-300 group-data-popup-open:rotate-180 motion-reduce:transition-none"
                        />
                    </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                    <Select.Positioner
                        alignItemWithTrigger={false}
                        sideOffset={8}
                        collisionPadding={16}
                        className="z-[60]"
                    >
                        <Select.Popup className="flow-popover flex max-h-(--available-height) w-(--anchor-width) max-w-[calc(100vw-2rem)] min-w-48 flex-col overflow-hidden outline-none">
                            <div className="surface-wash border-primary/15 shrink-0 border-b px-4 py-3 text-[9px] font-semibold tracking-[0.1em] text-slate-400">
                                {label.toUpperCase()}
                            </div>
                            <Select.List className="max-h-[280px] min-h-0 [scrollbar-width:thin] overflow-y-auto overscroll-contain p-1.5">
                                {options.map((option) => (
                                    <Select.Item
                                        key={option.value}
                                        value={option.value}
                                        disabled={option.disabled}
                                        className="data-highlighted:border-primary/25 data-highlighted:bg-primary/10 data-selected:bg-primary/15 data-selected:text-primary-foreground flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2.5 text-[12px] text-slate-500 outline-none data-disabled:pointer-events-none data-disabled:opacity-40"
                                    >
                                        {option.icon && (
                                            <span className="text-primary-foreground/70 flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white">
                                                {option.icon}
                                            </span>
                                        )}
                                        <span className="min-w-0 flex-1">
                                            <Select.ItemText className="block truncate font-medium">
                                                {option.label}
                                            </Select.ItemText>
                                            {option.description && (
                                                <span className="mt-1 block text-[10px] text-slate-400">
                                                    {option.description}
                                                </span>
                                            )}
                                        </span>
                                        <Select.ItemIndicator className="bg-brand flex size-4 shrink-0 items-center justify-center rounded-full text-white">
                                            <Check size={10} strokeWidth={2.5} />
                                        </Select.ItemIndicator>
                                    </Select.Item>
                                ))}
                            </Select.List>
                        </Select.Popup>
                    </Select.Positioner>
                </Select.Portal>
            </Select.Root>
        </FieldFrame>
    );
}
