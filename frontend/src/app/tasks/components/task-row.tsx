import { useMutation } from '@tanstack/react-query';
import { Flag, ListChecks, MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { ProjectIcon } from '@/app/projects/components/project-icon';
import { setTaskCompleted } from '../api/complete';
import { updateTask } from '../api/update';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import type { Task } from '../types';
import DisplayError from '@/components/display-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDay, formatTime } from '@/lib/date';
import { cn } from '@/lib/utils';

export function TaskRow({
    task,
    onOpen,
    today,
    board = false,
    dragHandle,
    disabled = false,
}: {
    task: Task;
    onOpen: (id: string) => void;
    today: string;
    board?: boolean;
    dragHandle?: ReactNode;
    disabled?: boolean;
}) {
    const invalidate = useInvalidateTasks();
    const completed = task.status === 'completed';
    const high = task.priority === 'high' || task.priority === 'urgent';
    const toggle = useMutation({
        mutationFn: (completed: boolean) => setTaskCompleted(task.id, completed),
        onSuccess: invalidate,
    });
    const priority = useMutation({
        mutationFn: () => updateTask(task.id, { priority: high ? 'normal' : 'high' }),
        onSuccess: invalidate,
    });
    return (
        <div
            className={cn(
                'group rounded-xl transition-colors hover:bg-neutral-50',
                board && 'border border-neutral-200 bg-white p-3'
            )}
        >
            <div className={cn('flex items-center gap-4 py-6', board && 'flex-wrap gap-3 py-1')}>
                {dragHandle}
                <Checkbox
                    checked={completed}
                    disabled={disabled || toggle.isPending}
                    aria-label={`${completed ? 'Reopen' : 'Complete'} task: ${task.title}`}
                    onCheckedChange={(value) => toggle.mutate(value)}
                    className={cn(
                        'border-primary size-6 shrink-0 rounded-full data-checked:text-white',
                        completed && 'bg-primary text-white'
                    )}
                />
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        disabled={disabled}
                        className={cn(
                            'block max-w-full text-left text-[15px] leading-snug font-medium lg:text-base',
                            completed && 'text-neutral-500 line-through'
                        )}
                        onClick={() => onOpen(task.id)}
                    >
                        {task.title}
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                        <span className="inline-flex items-center gap-1.5">
                            <ProjectIcon name={task.project_icon} size={13} />
                            <span>{task.project_name}</span>
                        </span>
                        {task.subtasks_count > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                                <ListChecks size={13} />
                                {task.completed_subtasks_count} / {task.subtasks_count}
                            </span>
                        )}
                        {task.status === 'in_progress' && (
                            <span className="text-secondary text-[11px]">In progress</span>
                        )}
                    </div>
                </div>
                <div
                    className={cn(
                        'flex shrink-0 items-center gap-2',
                        board && 'ml-9 w-full justify-end'
                    )}
                >
                    {task.due_date && (
                        <span
                            className={cn(
                                'mr-1 text-xs whitespace-nowrap',
                                task.due_date < today && !completed
                                    ? 'text-destructive'
                                    : 'text-neutral-700'
                            )}
                        >
                            {task.due_date !== today && (
                                <span className="mr-2">{formatDay(task.due_date)}</span>
                            )}
                            {task.due_time && formatTime(task.due_time)}
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={disabled || priority.isPending}
                        title={`Priority: ${task.priority}`}
                        aria-label={`${high ? 'Remove high priority from' : 'Mark high priority:'} ${task.title}`}
                        onClick={() => priority.mutate()}
                    >
                        <Flag
                            size={15}
                            className={cn(
                                high ? 'text-secondary' : 'text-neutral-500',
                                task.priority === 'urgent' && 'fill-secondary/15'
                            )}
                        />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit task: ${task.title}`}
                        disabled={disabled}
                        onClick={() => onOpen(task.id)}
                    >
                        <MoreHorizontal size={17} className="text-neutral-500" />
                    </Button>
                </div>
            </div>
            <DisplayError error={toggle.error || priority.error} />
        </div>
    );
}
