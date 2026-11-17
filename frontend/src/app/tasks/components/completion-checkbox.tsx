import { Checkbox } from '@/components/ui/checkbox';
import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export function CompletionCheckbox({
    completed,
    filling,
    draining,
    disabled,
    title,
    onChange,
    onFilled,
    onDrained,
}: {
    completed: boolean;
    filling: boolean;
    draining: boolean;
    disabled: boolean;
    title: string;
    onChange: (completed: boolean) => void;
    onFilled: () => void;
    onDrained: () => void;
}) {
    const reduceMotion = useReducedMotion();
    return (
        <Checkbox
            variant="task"
            checked={completed}
            disabled={disabled || filling || draining}
            aria-label={`${completed ? 'Reopen' : 'Complete'} task: ${title}`}
            aria-busy={filling || draining || undefined}
            onCheckedChange={onChange}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
            >
                {filling || draining ? (
                        <svg
                            viewBox="0 0 24 24"
                            className="text-primary size-full"
                            fill="currentColor"
                        >
                            <motion.g
                                initial={{ y: draining ? -3 : 25 }}
                                animate={{ y: draining ? 25 : -3 }}
                                transition={{
                                    duration: reduceMotion ? 0 : 1.5,
                                    ease: 'linear',
                                }}
                                onAnimationComplete={draining ? onDrained : onFilled}
                            >
                                <motion.path
                                    d="M-24 2Q-18-2-12 2T0 2T12 2T24 2T36 2T48 2T60 2T72 2V32H-24Z"
                                    initial={{ x: 0 }}
                                    animate={{ x: -24 }}
                                    transition={{
                                        duration: reduceMotion ? 0 : 1.1,
                                        ease: 'linear',
                                        repeat: reduceMotion ? 0 : Infinity,
                                    }}
                                />
                            </motion.g>
                        </svg>
                ) : completed ? (
                    <span className="bg-primary absolute inset-0" />
                ) : null}
            </span>
            {!draining && (completed || filling) && (
                <motion.span
                    key={completed ? 'completed' : 'filling'}
                    aria-hidden="true"
                    className="relative text-white"
                    initial={{ opacity: completed || reduceMotion ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        delay: completed || reduceMotion ? 0 : 1.3,
                        duration: reduceMotion ? 0 : 0.2,
                    }}
                >
                    <Check className="size-3.5" strokeWidth={2.5} />
                </motion.span>
            )}
        </Checkbox>
    );
}
