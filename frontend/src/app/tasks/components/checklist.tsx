import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { createSubTask, setSubTaskCompleted } from '../api/subtasks';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import type { Task } from '../types';
import type { SubTask } from '../types';
import { reorderSubTasks } from '../api/reorder';
import { SortableList } from '@/components/sortable';
import DisplayError from '@/components/display-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function TaskChecklist({ task }: { task: Task }) {
    const invalidate = useInvalidateTasks();
    const [title, setTitle] = useState('');
    const [ordered, setOrdered] = useState<SubTask[] | null>(null);
    const reorder = useMutation({
        mutationFn: (items: SubTask[]) =>
            reorderSubTasks(
                task.id,
                items.map((item) => item.id)
            ),
        onSuccess: async () => {
            await invalidate();
            setOrdered(null);
        },
        onError: () => {
            setOrdered(null);
            void invalidate();
        },
    });
    const toggle = useMutation({
        mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
            setSubTaskCompleted(task.id, id, completed),
        onSuccess: invalidate,
    });
    const create = useMutation({
        mutationFn: (title: string) =>
            createSubTask(
                task.id,
                title,
                Math.max(-1, ...task.subtasks.map((item) => item.position)) + 1
            ),
        onSuccess: async () => {
            setTitle('');
            await invalidate();
        },
    });
    return (
        <section className="grid gap-3 border-t border-neutral-200 pt-5">
            <div className="flex justify-between text-sm font-medium">
                <span>Subtasks</span>
                <span className="text-neutral-500">
                    {task.completed_subtasks_count} / {task.subtasks_count}
                </span>
            </div>
            <Progress
                value={task.completed_subtasks_count}
                max={task.subtasks_count}
                label="Checklist progress"
            />
            <SortableList
                items={ordered ?? task.subtasks}
                label={(item) => `Reorder subtask: ${item.title}`}
                disabled={reorder.isPending || toggle.isPending || create.isPending}
                onReorder={(items) => {
                    setOrdered(items);
                    reorder.mutate(items);
                }}
            >
                {(item, handle) => (
                    <div className="flex items-center gap-2 text-sm">
                        {handle}
                        <Checkbox
                            id={`subtask-${item.id}`}
                            aria-label={`Complete subtask: ${item.title}`}
                            checked={item.is_completed}
                            disabled={toggle.isPending || reorder.isPending}
                            onCheckedChange={(completed) =>
                                toggle.mutate({ id: item.id, completed })
                            }
                        />
                        <label
                            htmlFor={`subtask-${item.id}`}
                            className={cn(
                                'cursor-pointer',
                                item.is_completed && 'text-muted-foreground line-through'
                            )}
                        >
                            {item.title}
                        </label>
                    </div>
                )}
            </SortableList>
            {!task.subtasks.length && (
                <p className="text-sm text-neutral-400">Break this task into smaller steps.</p>
            )}
            <form
                className="flex gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (title.trim() && !create.isPending && !reorder.isPending)
                        create.mutate(title.trim());
                }}
            >
                <Input
                    aria-label="New subtask"
                    placeholder="Add a small step…"
                    maxLength={255}
                    className="h-9 text-sm"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={create.isPending || reorder.isPending}
                />
                <Button
                    type="submit"
                    variant="outline"
                    disabled={!title.trim() || reorder.isPending}
                    isPending={create.isPending}
                    aria-label="Add subtask"
                >
                    <Plus size={16} />
                </Button>
            </form>
            <DisplayError error={toggle.error || create.error || reorder.error} />
        </section>
    );
}
