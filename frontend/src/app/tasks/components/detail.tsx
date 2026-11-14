import { useMutation } from '@tanstack/react-query';
import { CircleCheck, FileText, ListChecks, Trash2 } from 'lucide-react';
import type { Project } from '@/app/projects/types';
import { deleteTask } from '../api/delete';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import type { Task } from '../types';
import DisplayError from '@/components/display-error';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { EditorHeader } from '@/components/editor-header';
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
            toast.add({
                type: 'warning',
                title: 'Task deleted',
                description: 'The task and its subtasks have been removed.',
            });
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
                <DrawerContent className="bg-workspace max-w-2xl border border-white shadow-[0_16px_80px_-24px_#02304750]">
                    {task && (
                        <>
                            <EditorHeader
                                title="A little more progress"
                                description={`${task.project_name} · Shape the details of your next step.`}
                                icon={
                                    task.status === 'completed' ? (
                                        <CircleCheck size={23} strokeWidth={1.5} />
                                    ) : (
                                        <FileText size={23} strokeWidth={1.5} />
                                    )
                                }
                                onClose={onClose}
                                disabled={remove.isPending}
                            />
                            <TaskForm
                                key={task.id}
                                task={task}
                                projects={projects}
                                onClose={onClose}
                            >
                                <div className="rounded-[22px] border border-slate-200/70 bg-white p-5 shadow-[0_3px_16px_-12px_#02304725]">
                                    <div className="text-primary-foreground mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em]">
                                        <span className="bg-primary/15 flex size-7 items-center justify-center rounded-lg">
                                            <ListChecks size={14} />
                                        </span>
                                        SMALL STEPS
                                        <span className="ml-auto text-[9px] font-normal tracking-normal text-slate-400">
                                            Progress lives here
                                        </span>
                                    </div>
                                    <TaskChecklist task={task} className="border-t-0 pt-0" />
                                </div>
                                <DisplayError error={remove.error} />
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                                    <div>
                                        <p className="text-primary-foreground text-[11px] font-medium">
                                            No longer needed?
                                        </p>
                                        <p className="mt-1 text-[9px] text-slate-400">
                                            This removes the task and its small steps.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="h-9 w-fit gap-2 rounded-xl text-[11px]"
                                        isPending={remove.isPending}
                                        onClick={() => remove.mutate(task.id)}
                                    >
                                        <Trash2 size={14} className="text-secondary" />
                                        Delete task
                                    </Button>
                                </div>
                            </TaskForm>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </>
    );
}
