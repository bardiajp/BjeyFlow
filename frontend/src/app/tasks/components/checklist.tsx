import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { createSubTask, deleteSubTask, setSubTaskCompleted } from '../api/subtasks';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import type { Task, SubTask } from '../types';
import { reorderSubTasks } from '../api/reorder';
import { SubtaskChecklist } from './subtask-checklist';

export function TaskChecklist({ task }: { task: Task }) {
    const invalidate = useInvalidateTasks();
    const [title, setTitle] = useState('');
    const [ordered, setOrdered] = useState<SubTask[] | null>(null);
    const remove = useMutation({
        mutationFn: (id: string) => deleteSubTask(task.id, id),
        onSuccess: async () => {
            setOrdered(null);
            await invalidate();
        },
    });
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
    const busy = reorder.isPending || toggle.isPending || create.isPending || remove.isPending;
    return (
        <SubtaskChecklist
            items={ordered ?? task.subtasks}
            title={title}
            onTitleChange={setTitle}
            onAdd={() => {
                if (title.trim() && !busy) create.mutate(title.trim());
            }}
            onToggle={(id, completed) => toggle.mutate({ id, completed })}
            onDelete={(id) => remove.mutate(id)}
            onReorder={(items) => {
                setOrdered(items);
                reorder.mutate(items);
            }}
            disabled={busy}
            adding={create.isPending}
            deletingId={remove.isPending ? remove.variables : undefined}
            error={toggle.error || create.error || reorder.error || remove.error}
        />
    );
}
