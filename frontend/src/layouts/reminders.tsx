import { Popover } from '@base-ui/react/popover';
import { Bell, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import type { Task } from '@/app/tasks/types';
import { Button } from '@/components/ui/button';
import { formatDay } from '@/lib/date';

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
    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger
                render={<Button variant="ghost" size="icon-sm" aria-label="Task reminders" />}
            >
                <Bell size={20} strokeWidth={1.5} />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner side="bottom" align="end" sideOffset={12} className="z-50">
                    <Popover.Popup className="bg-popover text-popover-foreground ring-foreground/10 w-80 max-w-[calc(100vw-2rem)] rounded-xl shadow-lg ring-1 outline-none">
                        <div className="border-b p-4">
                            <Popover.Title className="text-sm font-semibold">
                                Task reminders
                            </Popover.Title>
                            <Popover.Description className="text-muted-foreground mt-1 text-xs">
                                Your unfinished tasks due today or earlier.
                            </Popover.Description>
                        </div>
                        <div className="grid max-h-[min(24rem,60dvh)] gap-1 overflow-y-auto p-2">
                            {reminders.map((task) => (
                                <button
                                    type="button"
                                    key={task.id}
                                    className="focus-visible:outline-primary flex gap-3 rounded-lg p-3 text-left hover:bg-neutral-50 focus-visible:outline-2"
                                    onClick={() => {
                                        setOpen(false);
                                        onOpenTask(task.id);
                                    }}
                                >
                                    <CalendarDays
                                        size={17}
                                        className="text-primary mt-0.5 shrink-0"
                                    />
                                    <span>
                                        <span className="block text-sm font-medium">
                                            {task.title}
                                        </span>
                                        <span className="mt-1 block text-xs text-neutral-500">
                                            {task.project_name} ·{' '}
                                            {task.due_date === today
                                                ? 'Today'
                                                : formatDay(task.due_date!)}
                                        </span>
                                    </span>
                                </button>
                            ))}
                            {!reminders.length && (
                                <p className="py-6 text-center text-sm text-neutral-400">
                                    You’re all caught up. Enjoy a little breathing room.
                                </p>
                            )}
                        </div>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
