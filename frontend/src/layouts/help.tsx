import { Popover } from '@base-ui/react/popover';
import { CircleHelp, Command, CornerDownLeft, Keyboard, Plus, Search, Waves } from 'lucide-react';
import { AccentTitle } from '@/components/accent-title';
import { Button } from '@/components/ui/button';

export function HelpContent() {
    return (
        <div className="min-w-0">
            <div className="surface-wash border-input border-b p-4">
                <span className="text-muted-foreground mb-3 flex items-center gap-1.5 text-[8px] font-semibold tracking-[0.14em]">
                    <Waves size={12} />A LITTLE LESS FRICTION
                </span>
                <h2 className="text-foreground text-lg font-medium tracking-tight">
                    <AccentTitle>A little help along the way</AccentTitle>
                </h2>
                <p className="text-muted-foreground mt-2 text-[10px]">
                    Keep your hands on the keyboard. Stay in the flow.
                </p>
            </div>
            <dl className="grid gap-1 p-2">
                {[
                    {
                        label: 'Find a task',
                        detail: 'Open floating search',
                        keys: 'Ctrl / ⌘ K',
                        icon: Search,
                    },
                    { label: 'A new small step', detail: 'Create a task', keys: 'N', icon: Plus },
                    {
                        label: 'Keep this handy',
                        detail: 'Open this guide',
                        keys: '?',
                        icon: Keyboard,
                    },
                    {
                        label: 'Back to your flow',
                        detail: 'Close a panel or menu',
                        keys: 'Esc',
                        icon: CornerDownLeft,
                    },
                ].map(({ label, detail, keys, icon: Icon }) => (
                    <div key={keys} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5">
                        <span className="border-input bg-card text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg border">
                            <Icon size={14} />
                        </span>
                        <dt className="min-w-0 flex-1">
                            <span className="text-foreground block text-[11px] font-medium">
                                {label}
                            </span>
                            <span className="text-muted-foreground mt-1 block text-[9px]">
                                {detail}
                            </span>
                        </dt>
                        <dd>
                            <kbd className="border-input bg-card text-muted-foreground rounded-lg border px-2 py-1.5 font-sans text-[9px] shadow-sm">
                                {keys}
                            </kbd>
                        </dd>
                    </div>
                ))}
            </dl>
            <div className="border-input border-t px-4 py-3">
                <p className="text-muted-foreground text-[10px] leading-relaxed">
                    <span className="text-foreground font-medium">A little orientation.</span> Inbox
                    holds everything. Today keeps you focused. Tide gives your tasks a place in the
                    calendar.
                </p>
                <span className="text-muted-foreground mt-3 flex items-center gap-1.5 text-[9px]">
                    <Command size={11} />
                    Use ↑ ↓ to navigate search, then Enter to open.
                </span>
            </div>
        </div>
    );
}

export function HelpPopover({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Popover.Root open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger
                openOnHover
                delay={150}
                closeDelay={180}
                render={
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Help and shortcuts"
                        className="border-input bg-card/75 text-primary-foreground size-11 shrink-0 rounded-xl border"
                    />
                }
            >
                <CircleHelp size={18} strokeWidth={1.6} />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner
                    side="bottom"
                    align="end"
                    sideOffset={10}
                    collisionPadding={16}
                    className="z-[60]"
                >
                    <Popover.Popup className="flow-popover w-80 max-w-[calc(100vw-2rem)] overflow-hidden outline-none">
                        <Popover.Title className="sr-only">Help and shortcuts</Popover.Title>
                        <HelpContent />
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
