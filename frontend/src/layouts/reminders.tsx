import { Popover } from '@base-ui/react/popover';
import { Bell, Check, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import type { Task } from '@/app/tasks/types';
import { Button } from '@/components/ui/button';
import { formatDay } from '@/lib/date';
import { cn } from '@/lib/utils';
import { ProjectIcon } from '@/app/projects/components/project-icon';

export function RemindersDropdown({
    tasks,
    today,
    onOpenTask,
}: {
    tasks: Task[];
    today: string;
    onOpenTask: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const reminders = tasks
        .filter((task) => task.status !== 'completed' && task.due_date && task.due_date <= today)
        .sort((a, b) => a.due_date!.localeCompare(b.due_date!));
    const groups = [
        {
            label: 'A little overdue',
            overdue: true,
            tasks: reminders.filter((task) => task.due_date! < today),
        },
        {
            label: 'Due today',
            overdue: false,
            tasks: reminders.filter((task) => task.due_date === today),
        },
    ];
    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger
                render={
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Task reminders"
                        className="text-primary-foreground relative size-11 shrink-0 rounded-xl border border-slate-200/70 bg-white/75"
                    />
                }
            >
                <Bell size={20} strokeWidth={1.5} />
                {reminders.length > 0 && (
                    <span
                        aria-hidden="true"
                        className="bg-secondary absolute top-2 right-2 size-1.5 rounded-full ring-2 ring-white"
                    />
                )}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner
                    side="bottom"
                    align="end"
                    sideOffset={12}
                    collisionPadding={16}
                    className="z-50"
                >
                    <Popover.Popup className="flow-popover flex max-h-[min(560px,var(--available-height))] w-[350px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden outline-none">
                        <div className="surface-wash border-primary/15 shrink-0 border-b p-4">
                            <div className="flex items-center gap-2.5">
                                <span className="text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl border border-white bg-white/80">
                                    <Bell size={17} strokeWidth={1.6} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <Popover.Title className="text-primary-foreground text-[13px] font-semibold">
                                        Task reminders
                                    </Popover.Title>
                                    <span className="mt-0.5 block text-[9px] text-slate-400">
                                        A gentle nudge, not more noise.
                                    </span>
                                </div>
                                <span className="text-primary-foreground rounded-lg border border-white bg-white/80 px-2 py-1 text-[10px] font-medium tabular-nums">
                                    {reminders.length}
                                </span>
                                <Popover.Close
                                    render={
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label="Close reminders"
                                            className="size-7 rounded-lg text-slate-400"
                                        />
                                    }
                                >
                                    <X size={14} />
                                </Popover.Close>
                            </div>
                            <Popover.Description className="sr-only">
                                Your unfinished tasks due today or earlier.
                            </Popover.Description>
                        </div>
                        <div className="min-h-0 [scrollbar-width:thin] overflow-y-auto overscroll-contain p-2">
                            {groups
                                .filter((group) => group.tasks.length > 0)
                                .map((group) => (
                                    <section key={group.label} className="mb-2 last:mb-0">
                                        <h3 className="flex items-center gap-2 px-3 pt-3 pb-2 text-[9px] font-medium tracking-[0.08em] text-slate-400">
                                            <span
                                                className={cn(
                                                    'size-1.5 rounded-full',
                                                    group.overdue ? 'bg-orange-400' : 'bg-primary'
                                                )}
                                            />
                                            {group.label}
                                            <span className="ml-auto tabular-nums">
                                                {group.tasks.length}
                                            </span>
                                        </h3>
                                        <div className="grid gap-1">
                                            {group.tasks.map((task) => (
                                                <button
                                                    type="button"
                                                    key={task.id}
                                                    className="flow-control group flex w-full items-center gap-2.5 rounded-2xl border border-transparent bg-white px-3 py-3 text-left outline-none"
                                                    onClick={() => {
                                                        setOpen(false);
                                                        onOpenTask(task.id);
                                                    }}
                                                >
                                                    <span className="text-primary-foreground/70 flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                                                        <ProjectIcon
                                                            name={task.project_icon}
                                                            size={15}
                                                        />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="text-primary-foreground line-clamp-2 text-[12px] leading-relaxed font-medium">
                                                            {task.title}
                                                        </span>
                                                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-slate-400">
                                                            <span className="max-w-32 truncate">
                                                                {task.project_name}
                                                            </span>
                                                            <span
                                                                className={cn(
                                                                    'rounded-md px-1.5 py-0.5 tabular-nums',
                                                                    group.overdue
                                                                        ? 'bg-orange-50 text-orange-600'
                                                                        : 'bg-primary/15 text-primary-foreground'
                                                                )}
                                                            >
                                                                {group.overdue
                                                                    ? formatDay(task.due_date!)
                                                                    : 'Today'}
                                                            </span>
                                                        </span>
                                                    </span>
                                                    <ChevronRight
                                                        size={13}
                                                        aria-hidden="true"
                                                        className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            {!reminders.length && (
                                <div className="grid justify-items-center gap-3 px-6 py-10 text-center">
                                    <span className="bg-primary/15 text-primary-foreground flex size-12 items-center justify-center rounded-2xl">
                                        <Check size={22} strokeWidth={1.5} />
                                    </span>
                                    <p className="text-primary-foreground text-sm font-medium">
                                        All clear. Breathe a little.
                                    </p>
                                    <p className="text-[11px] leading-relaxed text-slate-400">
                                        No unfinished tasks due today or earlier.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="shrink-0 border-t border-slate-200/70 bg-white/70 px-5 py-3 text-[9px] text-slate-400">
                            One small step at a time.
                        </div>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
