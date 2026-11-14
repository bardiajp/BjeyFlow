import { Popover } from '@base-ui/react/popover';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { useId, useState, type ReactNode, type Ref } from 'react';
import { FieldFrame } from './field-frame';

export interface PickerFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    name?: string;
    onBlur?: () => void;
    ref?: Ref<HTMLButtonElement>;
    error?: string;
    description?: string;
    disabled?: boolean;
    required?: boolean;
}

export function PickerField({
    label,
    value,
    name,
    onBlur,
    ref,
    error,
    description,
    disabled,
    required,
    icon: Icon,
    displayValue,
    placeholder,
    variant,
    children,
}: Omit<PickerFieldProps, 'onChange'> & {
    icon: LucideIcon;
    displayValue: string;
    placeholder: string;
    variant: 'date' | 'time';
    children: (close: () => void) => ReactNode;
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    return (
        <FieldFrame
            id={id}
            label={label}
            required={required}
            error={error}
            description={description}
            variant={variant}
        >
            <input type="hidden" name={name} value={value} disabled={disabled} />
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger
                    ref={ref}
                    id={id}
                    disabled={disabled}
                    onBlur={onBlur}
                    aria-invalid={!!error}
                    aria-describedby={
                        error ? `${id}-error` : description ? `${id}-description` : undefined
                    }
                    className="group text-primary-foreground flex h-11 w-full min-w-0 items-center gap-2.5 rounded-[10px] border-0 bg-transparent px-3 text-left text-[13px] outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <span className="bg-primary/10 flex size-7 shrink-0 items-center justify-center rounded-lg">
                        <Icon size={15} strokeWidth={1.7} />
                    </span>
                    <span className={`min-w-0 flex-1 truncate ${value ? '' : 'text-slate-400'}`}>
                        {value ? displayValue : placeholder}
                    </span>
                    <ChevronDown
                        size={14}
                        className="shrink-0 text-slate-400 transition-transform duration-300 group-data-popup-open:rotate-180 motion-reduce:transition-none"
                    />
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Positioner
                        side="bottom"
                        align="start"
                        sideOffset={8}
                        collisionPadding={16}
                        className="z-[60]"
                    >
                        <Popover.Popup className="flow-popover max-h-(--available-height) w-[300px] max-w-[calc(100vw-2rem)] [scrollbar-width:thin] overflow-y-auto overscroll-contain outline-none">
                            <Popover.Title className="sr-only">{label}</Popover.Title>
                            {children(() => setOpen(false))}
                        </Popover.Popup>
                    </Popover.Positioner>
                </Popover.Portal>
            </Popover.Root>
        </FieldFrame>
    );
}
