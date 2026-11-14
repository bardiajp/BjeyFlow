import { Popover } from '@base-ui/react/popover';
import { Check, ChevronDown, X, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function TaskControlDropdown({
    label,
    description,
    icon: Icon,
    active = false,
    count,
    disabled = false,
    children,
}: {
    label: string;
    description: string;
    icon: LucideIcon;
    active?: boolean;
    count?: number;
    disabled?: boolean;
    children: ReactNode;
}) {
    return (
        <Popover.Root>
            <Popover.Trigger
                disabled={disabled}
                title={disabled ? 'This view has its own task order.' : label}
                className={cn(
                    'flow-control group focus-visible:ring-primary/60 data-popup-open:border-primary data-popup-open:bg-primary/15 text-primary-foreground flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40',
                    active && 'border-primary bg-primary/15 text-primary-foreground'
                )}
            >
                <Icon size={16} strokeWidth={1.7} aria-hidden="true" />
                {label}
                {!!count && (
                    <span className="bg-primary/40 flex size-4 items-center justify-center rounded-full text-[10px] tabular-nums">
                        {count}
                    </span>
                )}
                <ChevronDown
                    size={13}
                    className="text-muted-foreground transition-transform group-data-popup-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner
                    side="bottom"
                    align="end"
                    sideOffset={8}
                    collisionPadding={16}
                    collisionAvoidance={{ side: 'none', align: 'shift' }}
                    className="z-50"
                >
                    <Popover.Popup className="flow-popover flex max-h-(--available-height) w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden outline-none">
                        <div className="surface-wash border-primary/15 shrink-0 border-b px-4 pt-4 pb-3.5">
                            <div className="flex items-center gap-2.5">
                                <span className="text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl border border-white bg-white/80">
                                    <Icon size={17} strokeWidth={1.6} />
                                </span>
                                <Popover.Title className="text-primary-foreground flex-1 text-[13px] font-semibold">
                                    {label} tasks
                                </Popover.Title>
                                {active && (
                                    <span className="text-primary-foreground rounded-md border border-white bg-white/80 px-2 py-1 text-[9px] font-medium">
                                        {count ? `${count} active` : 'Custom'}
                                    </span>
                                )}
                                <Popover.Close
                                    render={
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label={`Close ${label.toLowerCase()}`}
                                            className="size-7 rounded-lg text-slate-400"
                                        />
                                    }
                                >
                                    <X size={14} />
                                </Popover.Close>
                            </div>
                            <Popover.Description className="mt-2.5 text-[10px] leading-relaxed text-slate-400">
                                {description}
                            </Popover.Description>
                        </div>
                        <div className="max-h-128 min-h-0 [scrollbar-width:thin] overflow-y-auto overscroll-contain p-2.5">
                            {children}
                        </div>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}

export function TaskControlOption({
    name,
    value,
    checked,
    onChange,
    children,
    disabled = false,
    description,
    icon,
}: {
    name: string;
    value: string;
    checked: boolean;
    onChange: () => void;
    children: ReactNode;
    disabled?: boolean;
    description?: string;
    icon?: ReactNode;
}) {
    return (
        <label className="block cursor-pointer has-disabled:cursor-not-allowed">
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="peer sr-only"
            />
            <span
                aria-disabled={disabled}
                className="flow-control peer-checked:border-primary/40 peer-checked:bg-primary/10 peer-checked:text-primary-foreground peer-focus-visible:ring-primary peer-checked:[&_.option-radio]:border-primary peer-checked:[&_.option-radio]:bg-brand flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2.5 text-[12px] text-slate-500 peer-focus-visible:ring-2 peer-disabled:pointer-events-none peer-disabled:opacity-50 [&_.option-check]:opacity-0 peer-checked:[&_.option-check]:opacity-100 peer-checked:[&_.option-radio]:text-white"
            >
                {icon && (
                    <span className="text-primary-foreground/70 flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white">
                        {icon}
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{children}</span>
                    {description && (
                        <span className="mt-1 block text-[10px] leading-relaxed font-normal text-slate-400">
                            {description}
                        </span>
                    )}
                </span>
                <span className="option-radio flex size-4 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white transition-colors">
                    <Check
                        className="option-check size-2.5 shrink-0"
                        strokeWidth={2.5}
                        aria-hidden="true"
                    />
                </span>
            </span>
        </label>
    );
}
