import { CalendarDays } from 'lucide-react';
import type { Task } from '@/app/tasks/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatDay } from '@/lib/date';

export function RemindersDialog({
    tasks,
    today,
    onClose,
    onOpenTask,
}: {
    tasks: Task[];
    today: string;
    onClose: () => void;
    onOpenTask: (id: string) => void;
}) {
    const reminders = tasks
        .filter((task) => task.status !== 'completed' && task.due_date && task.due_date <= today)
        .sort((a, b) => a.due_date!.localeCompare(b.due_date!));
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogTitle>A gentle reminder.</DialogTitle>
                <DialogDescription>Your unfinished tasks due today or earlier.</DialogDescription>
                <div className="grid gap-2">
                    {reminders.map((task) => (
                        <button
                            type="button"
                            key={task.id}
                            className="flex gap-3 rounded-lg p-3 text-left hover:bg-neutral-50"
                            onClick={() => {
                                onClose();
                                onOpenTask(task.id);
                            }}
                        >
                            <CalendarDays size={17} className="text-primary mt-0.5 shrink-0" />
                            <span>
                                <span className="block text-sm font-medium">{task.title}</span>
                                <span className="mt-1 block text-xs text-neutral-500">
                                    {task.project_name} ·{' '}
                                    {task.due_date === today ? 'Today' : formatDay(task.due_date!)}
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
            </DialogContent>
        </Dialog>
    );
}
