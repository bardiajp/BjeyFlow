import { Toast as ToastPrimitive } from '@base-ui/react/toast';
import { Loader2Icon, XIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const toast = ToastPrimitive.createToastManager();
const ToastTimeoutContext = React.createContext(5000);

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
    return (
        <ToastPrimitive.Viewport
            data-slot="toast-viewport"
            className={cn(
                'pointer-events-none fixed right-4 bottom-4 z-999 w-[calc(100%-2rem)] max-w-[390px] outline-none sm:right-6 sm:bottom-6 sm:w-full',
                className
            )}
            {...props}
        />
    );
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
    return (
        <ToastPrimitive.Root
            data-slot="toast"
            data-tone={props.toast.type}
            className={cn(
                'group/toast text-primary-foreground focus-visible:ring-primary/50 bg-popover/95 pointer-events-auto absolute right-0 bottom-0 z-999 w-full origin-bottom rounded-[22px] border border-white/90 shadow-[0_12px_40px_-12px_#02304735,0_2px_8px_-4px_#02304715] backdrop-blur-xl will-change-transform outline-none select-none focus-visible:ring-2',
                '[--toast-accent:#538fa9] data-[tone=completed]:[--toast-accent:#398aa8] data-[tone=destructive]:[--toast-accent:#e15465] data-[tone=success]:[--toast-accent:#059669] data-[tone=warning]:[--toast-accent:#ea8613]',
                '[--gap:0.75rem] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))]',
                'h-(--toast-height) transform-[translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))] [transition:transform_550ms_cubic-bezier(0.25,0.8,0.25,1),opacity_400ms,height_200ms]',
                "after:absolute after:inset-s-0 after:top-full after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
                'data-limited:opacity-0 data-starting-style:transform-[translateY(150%)]',
                '[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:transform-[translateY(150%)]',
                'data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
                'data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]',
                'data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]',
                'data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
                'motion-reduce:transition-none',
                className
            )}
            {...props}
        />
    );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
    return (
        <ToastPrimitive.Content
            data-slot="toast-content"
            className={cn(
                'relative z-10 flex h-full items-start gap-3 overflow-hidden px-4 pt-4 pb-6 transition-opacity duration-300 ease-in-out motion-reduce:transition-none',
                className
            )}
            {...props}
        />
    );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
    return (
        <ToastPrimitive.Title
            data-slot="toast-title"
            className={cn(
                'text-primary-foreground text-[12px] leading-relaxed font-semibold wrap-anywhere',
                className
            )}
            {...props}
        />
    );
}

function ToastDescription({ className, ...props }: ToastPrimitive.Description.Props) {
    return (
        <ToastPrimitive.Description
            data-slot="toast-description"
            className={cn(
                'text-[11px] leading-relaxed font-normal wrap-anywhere text-slate-400',
                className
            )}
            {...props}
        />
    );
}

function ToastAction({
    className,
    render = <Button variant="outline" size="sm" />,
    ...props
}: ToastPrimitive.Action.Props) {
    return (
        <ToastPrimitive.Action
            data-slot="toast-action"
            render={render}
            className={cn(
                'border-primary/20 text-primary-foreground mt-1 h-7 shrink-0 rounded-lg bg-white/80 px-2.5 text-[10px]',
                className
            )}
            {...props}
        />
    );
}

function ToastClose({
    className,
    children,
    render = <Button variant="ghost" size="icon-sm" />,
    ...props
}: ToastPrimitive.Close.Props) {
    return (
        <ToastPrimitive.Close
            data-slot="toast-close"
            aria-label="Close toast"
            render={render}
            className={cn(
                "relative -mt-0.5 -mr-1 size-6 shrink-0 rounded-lg text-slate-400 after:absolute after:-inset-1 after:content-[''] [&_svg]:size-3.5",
                className
            )}
            {...props}
        >
            {children ?? <XIcon aria-hidden="true" />}
        </ToastPrimitive.Close>
    );
}

function ToastIcon({ type }: { type?: string }) {
    const reduceMotion = useReducedMotion();
    const colors: Record<string, string> = {
        success: 'text-emerald-600',
        completed: 'text-[#398aa8]',
        destructive: 'text-rose-500',
        info: 'text-[#538fa9]',
        warning: 'text-orange-500',
        loading: 'text-[#538fa9]',
    };
    if (!type || !colors[type]) return null;

    const draw = {
        initial: { pathLength: reduceMotion ? 1 : 0 },
        animate: { pathLength: 1 },
        transition: { duration: reduceMotion ? 0 : 0.45, ease: 'easeInOut' as const },
    };

    return (
        <span
            data-slot="toast-icon"
            className={cn(
                'inline-grid size-10 shrink-0 place-items-center rounded-[14px] border [border-color:color-mix(in_srgb,var(--toast-accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--toast-accent)_10%,var(--card))] [&_svg]:pointer-events-none [&_svg]:size-5',
                colors[type]
            )}
        >
            {type === 'loading' ? (
                <Loader2Icon
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                />
            ) : (
                <svg
                    key={type}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={type === 'success' || type === 'completed' ? 2.5 : 1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    {type === 'success' || type === 'completed' ? (
                        <motion.path d="m20 6-11 11-5-5" {...draw} />
                    ) : type === 'info' ? (
                        <>
                            <motion.circle cx="12" cy="12" r="10" {...draw} />
                            <motion.path
                                d="M12 16v-4m0-4h.01"
                                {...draw}
                                transition={{ ...draw.transition, delay: reduceMotion ? 0 : 0.15 }}
                            />
                        </>
                    ) : (
                        <>
                            <motion.path
                                d="M10.27 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.73 3.86a2 2 0 0 0-3.46 0Z"
                                {...draw}
                            />
                            <motion.path
                                d="M12 9v4m0 4h.01"
                                {...draw}
                                transition={{ ...draw.transition, delay: reduceMotion ? 0 : 0.15 }}
                            />
                        </>
                    )}
                </svg>
            )}
        </span>
    );
}

function ToastProgressBar({ duration, type }: { duration: number; type?: string }) {
    const [windowPaused, setWindowPaused] = React.useState(false);
    React.useEffect(() => {
        const onBlur = () => setWindowPaused(true);
        const onFocus = () => setWindowPaused(false);
        window.addEventListener('blur', onBlur);
        window.addEventListener('focus', onFocus);
        return () => {
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 bottom-2.5 z-10 h-0.5 overflow-hidden rounded-full bg-slate-200/60"
        >
            <div
                data-slot="toast-progress"
                data-tone={type}
                className="absolute inset-0 origin-left animate-[toast-progress_linear_forwards] rounded-full bg-(--toast-accent) opacity-60 group-data-expanded/toast:[animation-play-state:paused]"
                style={{
                    animationDuration: `${duration}ms`,
                    animationPlayState: windowPaused ? 'paused' : undefined,
                }}
            />
        </div>
    );
}

function ToastList() {
    const { toasts } = ToastPrimitive.useToastManager();
    const defaultTimeout = React.useContext(ToastTimeoutContext);
    return toasts.map((item) => {
        const timeout = item.timeout ?? defaultTimeout;
        return (
            <Toast key={item.id} toast={item}>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                >
                    <svg
                        viewBox="0 0 400 55"
                        preserveAspectRatio="none"
                        className="absolute inset-x-0 bottom-0 h-10 w-full text-(--toast-accent)"
                    >
                        <path
                            d="M0 35Q100 0 200 35T400 35V55H0Z"
                            fill="currentColor"
                            fillOpacity="0.045"
                        />
                        <path
                            d="M0 45Q100 10 200 45T400 45"
                            fill="none"
                            stroke="currentColor"
                            strokeOpacity="0.12"
                        />
                    </svg>
                </div>
                <ToastContent>
                    <ToastIcon type={item.type} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                        <ToastTitle />
                        <ToastDescription />
                    </div>
                    <ToastAction />
                    <ToastClose />
                </ToastContent>
                {timeout > 0 && item.type !== 'loading' && (
                    <ToastProgressBar key={item.updateKey} duration={timeout} type={item.type} />
                )}
            </Toast>
        );
    });
}

function Toaster({
    children,
    timeout = 5000,
    toastManager = toast,
    ...props
}: ToastPrimitive.Provider.Props) {
    return (
        <ToastTimeoutContext.Provider value={timeout}>
            <ToastPrimitive.Provider timeout={timeout} toastManager={toastManager} {...props}>
                {children}
                <ToastPrimitive.Portal>
                    <ToastViewport>
                        <ToastList />
                    </ToastViewport>
                </ToastPrimitive.Portal>
            </ToastPrimitive.Provider>
        </ToastTimeoutContext.Provider>
    );
}

export {
    Toaster,
    Toast,
    ToastAction,
    ToastClose,
    ToastContent,
    ToastDescription,
    ToastIcon,
    ToastProgressBar,
    ToastTitle,
    ToastViewport,
    toast,
};
