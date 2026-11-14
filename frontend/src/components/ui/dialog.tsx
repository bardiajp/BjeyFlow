import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function Dialog(props: DialogPrimitive.Root.Props) {
    return <DialogPrimitive.Root {...props} />;
}
export function DialogContent({
    className,
    children,
    onKeyDown,
    ...props
}: DialogPrimitive.Popup.Props) {
    return (
        <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
            <DialogPrimitive.Popup
                data-slot="dialog-content"
                className={cn(
                    'bg-popover text-popover-foreground ring-foreground/10 fixed top-1/2 left-1/2 z-50 grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl p-6 text-sm ring-1 outline-none',
                    className
                )}
                {...props}
                onKeyDown={(event) => {
                    onKeyDown?.(event);
                    // Base UI normally stops arrow-key bubbling. Drag handles need
                    // those events to reach dnd-kit's document-level keyboard sensor.
                    if (
                        (event.target as HTMLElement).closest('[data-sortable-handle]') &&
                        event.key.startsWith('Arrow')
                    ) {
                        event.preventBaseUIHandler();
                    }
                }}
            >
                {children}
                <DialogPrimitive.Close
                    render={
                        <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" />
                    }
                >
                    <XIcon aria-hidden="true" />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
    );
}
export function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
    return (
        <DialogPrimitive.Title className={cn('text-base font-semibold', className)} {...props} />
    );
}
export function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
    return (
        <DialogPrimitive.Description
            className={cn('text-muted-foreground text-sm', className)}
            {...props}
        />
    );
}
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
    return <div className={cn('flex justify-end gap-2 border-t pt-4', className)} {...props} />;
}
