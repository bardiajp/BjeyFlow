import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Check, LoaderCircle, RotateCcw, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { AccentTitle } from '@/components/accent-title';
import { errorMessage } from '@/lib/error-message';
import { cn } from '@/lib/utils';

export function InlineConfirm({
    children,
    label,
    title,
    description,
    confirmLabel,
    onConfirm,
    disabled = false,
    tone = 'danger',
    className,
}: {
    children: ReactNode;
    label: string;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<unknown>;
    disabled?: boolean;
    tone?: 'danger' | 'normal';
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>(null);
    const container = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const cancelButton = useRef<HTMLButtonElement>(null);
    const titleId = useId();
    const descriptionId = useId();
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        if (open) cancelButton.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open || pending) return;
        const dismiss = (event: PointerEvent) => {
            if (!container.current?.contains(event.target as Node)) {
                setOpen(false);
                setError(null);
            }
        };
        document.addEventListener('pointerdown', dismiss);
        return () => document.removeEventListener('pointerdown', dismiss);
    }, [open, pending]);

    const cancel = () => {
        setOpen(false);
        setError(null);
        requestAnimationFrame(() => trigger.current?.focus());
    };
    const confirm = async () => {
        if (pending) return;
        setPending(true);
        setError(null);
        try {
            await onConfirm();
            setOpen(false);
        } catch (error) {
            setError(error);
        } finally {
            setPending(false);
        }
    };

    return (
        <div
            ref={container}
            className={cn('relative h-9 w-40 max-w-full shrink-0 overflow-hidden rounded-xl whitespace-normal', className)}
            data-confirming={open}
            onKeyDown={(event) => {
                if (open && !pending && event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    cancel();
                }
            }}
        >
            <motion.div
                className="absolute inset-0"
                animate={{ opacity: open ? 0 : 1, x: reduceMotion ? 0 : open ? -6 : 0 }}
                initial={false}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                style={{ pointerEvents: open ? 'none' : 'auto' }}
                aria-hidden={open}
                inert={open}
            >
                <Button
                    ref={trigger}
                    type="button"
                    variant={tone === 'danger' ? 'destructive' : 'ghost'}
                    className={cn(
                        'h-full w-full justify-center gap-2 rounded-xl text-xs focus-visible:ring-2 focus-visible:ring-[#8ecae6] focus-visible:ring-inset',
                        'text-primary-foreground'
                    )}
                    aria-label={label}
                    aria-expanded={open}
                    disabled={disabled}
                    onClick={() => setOpen(true)}
                >
                    {children}
                </Button>
            </motion.div>
            <motion.div
                role="group"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                aria-hidden={!open}
                inert={!open}
                className={cn(
                    'absolute inset-0 flex items-center gap-1 rounded-xl border px-1.5',
                    tone === 'danger'
                        ? 'border-secondary/25 bg-secondary/5'
                        : 'border-primary/30 bg-primary/10'
                )}
                animate={{ opacity: open ? 1 : 0, x: reduceMotion ? 0 : open ? 0 : 6 }}
                initial={false}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                style={{ pointerEvents: open ? 'auto' : 'none' }}
            >
                <span
                    id={titleId}
                    role={error !== null ? 'alert' : undefined}
                    tabIndex={error !== null ? 0 : undefined}
                    className="text-foreground min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto py-1 text-[10px] leading-5 whitespace-nowrap outline-none focus-visible:ring-2"
                >
                    {error !== null ? (
                        errorMessage(error)
                    ) : (
                        <AccentTitle trailingDot={false}>{title}</AccentTitle>
                    )}
                </span>
                <span id={descriptionId} className="sr-only">
                    {description}
                </span>
                <Button
                    ref={cancelButton}
                    type="button"
                    variant="ghost"
                    className="text-muted-foreground size-7 shrink-0 rounded-lg p-0"
                    aria-label="Cancel"
                    disabled={pending}
                    onClick={cancel}
                >
                    <X size={13} aria-hidden="true" />
                </Button>
                <Button
                    type="button"
                    className={cn(
                        'size-7 shrink-0 rounded-lg p-0',
                        tone === 'danger'
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-brand text-white'
                    )}
                    aria-label={error !== null ? `Retry: ${confirmLabel}` : confirmLabel}
                    aria-describedby={descriptionId}
                    aria-busy={pending}
                    disabled={disabled || pending}
                    onClick={() => void confirm()}
                >
                    {pending ? (
                        <LoaderCircle
                            size={13}
                            className="animate-spin motion-reduce:animate-none"
                            aria-hidden="true"
                        />
                    ) : error !== null ? (
                        <RotateCcw size={13} aria-hidden="true" />
                    ) : (
                        <Check size={13} aria-hidden="true" />
                    )}
                </Button>
            </motion.div>
        </div>
    );
}
