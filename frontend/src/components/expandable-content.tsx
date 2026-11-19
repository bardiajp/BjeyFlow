import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export function ExpandableContent({
    open,
    id,
    children,
    keepMounted = false,
}: {
    open: boolean;
    id: string;
    children: ReactNode;
    keepMounted?: boolean;
}) {
    const reduceMotion = useReducedMotion();
    const transition = { duration: reduceMotion ? 0 : 0.24, ease: 'easeInOut' as const };
    if (keepMounted) {
        return (
            <motion.div
                id={id}
                aria-hidden={!open}
                inert={!open}
                initial={false}
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                transition={transition}
                className="overflow-hidden"
            >
                {children}
            </motion.div>
        );
    }
    return (
        <div id={id} aria-hidden={!open} inert={!open}>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={transition}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
