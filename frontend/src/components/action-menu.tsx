import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';

export function ActionMenu({ label, children }: { label: string; children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const reduceMotion = useReducedMotion();

    return (
        <div className="relative w-full sm:w-80 sm:shrink-0">
            <Button
                type="button"
                variant="outline"
                aria-label={label}
                aria-expanded={open}
                aria-controls={id}
                className="w-full gap-2 text-xs sm:ml-auto sm:flex sm:w-auto"
                onClick={() => setOpen((value) => !value)}
            >
                <MoreHorizontal size={15} aria-hidden="true" />
                Manage
                <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                />
            </Button>
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
                        <div className="border-input bg-card mt-2 grid grid-cols-2 items-center gap-2 rounded-xl border p-2 [&>[data-confirming]]:w-full">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
