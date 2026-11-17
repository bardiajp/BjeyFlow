import { useId, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, ListChecks } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { setSubTaskCompleted } from '../api/subtasks';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import type { Task } from '../types';
import { Checkbox } from '@/components/ui/checkbox';
import DisplayError from '@/components/display-error';
import { cn } from '@/lib/utils';

export function QuickSubtasks({ task, board, disabled }: { task: Task; board: boolean; disabled: boolean }) {
    const [open, setOpen] = useState(false);
    const id = useId();
    const reduceMotion = useReducedMotion();
    const invalidate = useInvalidateTasks();
    const toggle = useMutation({
        mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
            setSubTaskCompleted(task.id, id, completed),
        onSuccess: () => invalidate(),
    });
    const completed = task.subtasks.filter((item) =>
        toggle.isPending && toggle.variables?.id === item.id
            ? toggle.variables.completed
            : item.is_completed
    ).length;

    return (
        <div
            className={cn('min-w-0', board ? 'w-full' : 'px-1 pb-3 sm:px-3')}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                disabled={disabled}
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((value) => !value)}
                className={cn(
                    'flow-control focus-visible:ring-primary/50 text-muted-foreground inline-flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs outline-none focus-visible:ring-2 disabled:opacity-50',
                    board && 'bg-accent/60 w-full'
                )}
            >
                <ListChecks size={14} aria-hidden="true" />
                <span className="flex-1">Checklist</span>
                <span className="tabular-nums">{completed} / {task.subtasks_count}</span>
                <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className={cn('transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')}
                />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={id}
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="border-input bg-card mt-2 grid gap-1 rounded-xl border p-2">
                            {task.subtasks.map((item) => {
                                const checked = toggle.isPending && toggle.variables?.id === item.id
                                    ? toggle.variables.completed
                                    : item.is_completed;
                                return (
                                    <label key={item.id} className="hover:bg-accent/60 flex min-w-0 cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors">
                                        <Checkbox
                                            aria-label={`${checked ? 'Reopen' : 'Complete'} subtask: ${item.title}`}
                                            checked={checked}
                                            disabled={disabled || toggle.isPending}
                                            onCheckedChange={(value) => toggle.mutate({ id: item.id, completed: value })}
                                        />
                                        <span className={cn('text-foreground min-w-0 flex-1 break-words text-xs leading-5', checked && 'text-muted-foreground line-through')}>
                                            {item.title}
                                        </span>
                                    </label>
                                );
                            })}
                            <DisplayError error={toggle.error} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
