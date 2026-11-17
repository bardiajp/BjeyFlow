import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, Link2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export function AttachTaskSection({ label, children }: { label: string; children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const reduceMotion = useReducedMotion();

    return (
        <section className="border-input bg-card overflow-hidden rounded-xl border">
            <button
                type="button"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((value) => !value)}
                className="flow-control text-foreground flex w-full items-center gap-2 px-3 py-3 text-left text-xs font-medium"
            >
                <Link2 size={14} aria-hidden="true" />
                <span className="flex-1">{label}</span>
                <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={id}
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="border-input border-t p-3">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
