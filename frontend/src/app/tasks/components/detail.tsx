import { useMutation } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import type { Project } from '@/app/projects/types';
import { deleteTask } from '../api/delete';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import type { Task } from '../types';
import DisplayError from '@/components/display-error';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { TaskChecklist } from './checklist';
import { TaskForm } from './form';

export function TaskDetailDrawer({
    open,
    task,
    projects,
    onClose,
    onClosed,
}: {
    open: boolean;
    task?: Task;
    projects: Project[];
    onClose: () => void;
    onClosed: () => void;
}) {
    const invalidate = useInvalidateTasks();
    const remove = useMutation({
        mutationFn: deleteTask,
        onSuccess: async () => {
            onClose();
            await invalidate();
        },
    });
    return (
        <>
            <Drawer
                open={open && !!task}
                onOpenChange={(open) => {
                    if (!open && !remove.isPending) onClose();
                }}
                onOpenChangeComplete={(isOpen) => {
                    if (!isOpen) {
                        remove.reset();
                        onClosed();
                    }
                }}
            >
                <DrawerContent>
                    {task && (
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <DrawerTitle>Task details</DrawerTitle>
                                <DrawerDescription>
                                    {task.project_name} · Make a little room for progress.
                                </DrawerDescription>
                            </div>
                            <TaskForm
                                key={task.id}
                                task={task}
                                projects={projects}
                                onClose={onClose}
                            />
                            <TaskChecklist task={task} />
                            <DisplayError error={remove.error} />
                            <div className="flex justify-end">
                                <Button
                                    variant="destructive"
                                    className="w-fit gap-2"
                                    isPending={remove.isPending}
                                    onClick={() => remove.mutate(task.id)}
                                >
                                    <Trash2 size={14} className="text-secondary" />
                                    Delete task
                                </Button>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}
