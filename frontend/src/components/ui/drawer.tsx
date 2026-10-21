import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer';
import { cn } from '@/lib/utils';

// Adapted from DVocean's right-side drawer.
export function Drawer(props: DrawerPrimitive.Root.Props) {
    return <DrawerPrimitive.Root swipeDirection="right" {...props} />;
}

export function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
    return (
        <DrawerPrimitive.Portal>
            <DrawerPrimitive.Backdrop
                data-slot="drawer-overlay"
                className="fixed inset-0 z-50 min-h-dvh bg-black/10 opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] select-none data-ending-style:pointer-events-none data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 supports-backdrop-filter:backdrop-blur-xs"
            />
            <DrawerPrimitive.Viewport className="fixed inset-0 z-50">
                <DrawerPrimitive.Popup
                    data-slot="drawer-popup"
                    className={cn(
                        'bg-popover text-popover-foreground fixed top-0 m-(--drawer-inset) flex h-(--drawer-height,auto) max-h-[calc(100dvh-2*var(--drawer-inset))] min-h-0 w-[calc(100%-2*var(--drawer-inset))] max-w-3xl flex-col overflow-hidden rounded-[32px] text-sm outline-none select-none [--drawer-inset:12px] data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:origin-left data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:origin-right sm:[--drawer-inset:40px]',
                        // Use DVocean's transform and easing with a half-second slide-in.
                        'transform-[translate3d(var(--translate-x,0px),var(--translate-y,0px),0)_scale(var(--stack-scale))] transition-[transform,height,opacity,filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform [interpolate-size:allow-keywords]',
                        '[--peek:1rem] [--stack-height:var(--drawer-frontmost-height,var(--drawer-height,0px))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--stack-shrink:calc(1-var(--stack-scale))] [--stack-step:0.05]',
                        'data-[swipe-direction=left]:[--closed-transform:translate3d(calc(-100%-var(--drawer-inset,0px)-2px),0,0)] data-[swipe-direction=left]:[--translate-x:calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)+(var(--stack-shrink)*100%))] data-[swipe-direction=right]:[--closed-transform:translate3d(calc(100%+var(--drawer-inset,0px)+2px),0,0)] data-[swipe-direction=right]:[--translate-x:calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)-(var(--stack-shrink)*100%))]',
                        'data-ending-style:transform-(--closed-transform) data-ending-style:opacity-[0.9999] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*800ms)] data-nested-drawer-open:overflow-hidden data-nested-drawer-open:brightness-95 data-nested-drawer-swiping:duration-0 data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*800ms)] data-starting-style:transform-(--closed-transform) data-starting-style:duration-500 data-swiping:duration-0 data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*800ms)]',
                        className
                    )}
                    {...props}
                >
                    <DrawerPrimitive.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 select-text sm:p-8">
                        {children}
                    </DrawerPrimitive.Content>
                </DrawerPrimitive.Popup>
            </DrawerPrimitive.Viewport>
        </DrawerPrimitive.Portal>
    );
}

export function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
    return (
        <DrawerPrimitive.Title className={cn('text-base font-semibold', className)} {...props} />
    );
}

export function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
    return (
        <DrawerPrimitive.Description
            className={cn('text-muted-foreground text-sm', className)}
            {...props}
        />
    );
}
