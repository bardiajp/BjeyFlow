import { useMutation } from '@tanstack/react-query';
import { CalendarDays, Flag, GripVertical, MoreHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ProjectIcon } from '@/app/projects/components/project-icon';
import { setTaskCompleted } from '../api/complete';
import { updateTask } from '../api/update';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import type { Task } from '../types';
import DisplayError from '@/components/display-error';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { CompletionCheckbox } from './completion-checkbox';
import { formatDay, formatTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { QuickSubtasks } from './quick-subtasks';

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
    const [filling, setFilling] = useState(false);
    const [draining, setDraining] = useState(false);
    const completed = task.status === 'completed';
    const high = task.priority === 'high' || task.priority === 'urgent';
    const toggle = useMutation({
        mutationFn: (completed: boolean) => setTaskCompleted(task.id, completed),
        onSuccess: async (_, completed) => {
            toast.add({
                type: completed ? 'completed' : 'info',
                title: completed ? 'Task completed' : 'Task reopened',
                description: `“${task.title}” ${completed ? 'is marked as completed' : 'is back on your to-do list'}.`,
            });
            await invalidate();
            setFilling(false);
            setDraining(false);
        },
        onError: () => {
            setFilling(false);
            setDraining(false);
        },
    });
    const priority = useMutation({
        mutationFn: () => updateTask(task.id, { priority: high ? 'normal' : 'high' }),
        onSuccess: async (updated) => {
            toast.add({
                type: 'info',
                title: 'Priority updated',
                description: `“${task.title}” now has ${updated.priority} priority.`,
            });
            await invalidate();
        },
    });
    return (
        <div
            className={cn(
                'group hover:border-primary/20 hover:bg-accent/60 rounded-xl border border-transparent transition-[background-color,border-color] duration-200 motion-reduce:transition-none',
                board &&
                    'hover:border-primary/50 rounded-2xl border-slate-200/80 bg-white p-3 shadow-[0_3px_10px_-6px_#02304725] transition-[background-color,border-color,box-shadow] hover:bg-white hover:shadow-[0_6px_18px_-8px_#02304735] sm:p-4'
            )}
        >
            {board && (
                <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                        className={cn(
                            'inline-flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-medium',
                            high ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'
                        )}
                    >
                        <Flag size={10} className={high ? 'fill-current' : undefined} />
                        {task.priority === 'urgent'
                            ? 'Urgent'
                            : high
                              ? 'High priority'
                              : task.priority === 'low'
                                ? 'Low priority'
                                : 'Normal priority'}
                    </span>
                    <GripVertical
                        size={15}
                        className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-400"
                        aria-hidden="true"
                    />
                </div>
            )}
            <div
                className={cn(
                    'flex items-center gap-2 px-1 py-3 sm:gap-3 sm:px-3 sm:py-4',
                    board && 'flex-col items-stretch gap-3 px-0 py-0 sm:px-0'
                )}
            >
                {dragHandle}
                {!board && (
                    <CompletionCheckbox
                        completed={completed}
                        filling={filling}
                        draining={draining}
                        disabled={disabled || toggle.isPending}
                        title={task.title}
                        onChange={(value) => {
                            if (value) setFilling(true);
                            else setDraining(true);
                        }}
                        onFilled={() => toggle.mutate(true)}
                        onDrained={() => toggle.mutate(false)}
                    />
                )}
                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        disabled={disabled}
                        className={cn(
                            'hover:text-primary-foreground block max-w-full text-left text-[13px] leading-snug font-medium text-slate-700 outline-none focus-visible:underline sm:text-sm',
                            board &&
                                'text-primary-foreground text-[14px] leading-relaxed font-semibold',
                            completed && 'text-neutral-500 line-through'
                        )}
                        onClick={() => onOpen(task.id)}
                    >
                        {task.title}
                    </button>
                    {board && task.description && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                            {task.description}
                        </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 sm:text-[11px]">
                        <span className="text-muted-foreground font-mono text-[10px]">
                            {task.identifier}
                        </span>
                        <span
                            className="text-foreground inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5"
                            style={{ backgroundColor: `color-mix(in srgb, ${task.project_color || '#8ECAE6'} 22%, transparent)` }}
                        >
                            <ProjectIcon name={task.project_icon} size={13} color={task.project_color || '#8ECAE6'} />
                            <span>{task.project_name}</span>
                        </span>
                        {!board && task.status === 'in_progress' && (
                            <span className="text-secondary text-[11px]">In progress</span>
                        )}
                    </div>
                </div>
                {board && task.subtasks_count > 0 && (
                    <QuickSubtasks task={task} board disabled={disabled} />
                )}
                <div
                    className={cn(
                        'flex shrink-0 items-center gap-0.5 sm:gap-1',
                        board && 'w-full flex-wrap justify-end border-t border-slate-100 pt-2.5'
                    )}
                >
                    {task.due_date && (
                        <span
                            className={cn(
                                'mr-1 inline-flex items-center rounded-md px-1.5 py-1 text-[10px] whitespace-nowrap sm:text-[11px]',
                                board && 'mr-auto',
                                task.due_date < today && !completed
                                    ? 'bg-rose-50 text-rose-500'
                                    : 'bg-slate-50 text-slate-500'
                            )}
                        >
                            {board && <CalendarDays size={11} className="mr-1.5" />}
                            {board && task.due_date === today && (
                                <span className="mr-1">Today</span>
                            )}
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
            {!board && task.subtasks_count > 0 && (
                <QuickSubtasks task={task} board={false} disabled={disabled} />
            )}
            <DisplayError error={toggle.error || priority.error} />
        </div>
    );
}
