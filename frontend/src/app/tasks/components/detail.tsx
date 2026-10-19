import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Project } from '@/app/projects/types';
import { deleteTask } from '../api/delete';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import type { Task } from '../types';
import ConfirmDialog from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { TaskChecklist } from './checklist';
import { TaskForm } from './form';

export function TaskDetailDialog({
    task,
    projects,
    onClose,
}: {
    task: Task;
    projects: Project[];
    onClose: () => void;
}) {
    const invalidate = useInvalidateTasks();
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <>
            <Dialog
                open
                onOpenChange={(open) => {
                    if (!open) onClose();
                }}
            >
                <DialogContent className="sm:max-w-xl">
                    <DialogTitle>Task details</DialogTitle>
                    <DialogDescription>
                        {task.project_name} · Make a little room for progress.
                    </DialogDescription>
                    <TaskForm task={task} projects={projects} onClose={onClose} />
                    <TaskChecklist task={task} />
                    <Button
                        variant="destructive"
                        className="w-fit gap-2"
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 size={14} className="text-secondary" />
                        Delete task
                    </Button>
                </DialogContent>
            </Dialog>
            {confirmDelete && (
                <ConfirmDialog
                    title="Delete this task?"
                    description="This also removes its subtasks. This cannot be undone."
                    destructive
                    action={() => deleteTask(task.id)}
                    onSuccess={async () => {
                        await invalidate();
                        onClose();
                    }}
                    onClose={() => {
                        setConfirmDelete(false);
                    }}
                />
            )}
        </>
    );
}
