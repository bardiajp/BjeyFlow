import type { Project } from '@/app/projects/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from './form';
import Loading from '@/components/loading';
import DisplayError from '@/components/display-error';

export function CreateTaskDialog({
    projects,
    projectId,
    dueDate,
    onClose,
    onCreateProject,
    loading,
    error,
}: {
    projects: Project[];
    projectId?: string;
    dueDate?: string;
    onClose: () => void;
    onCreateProject: () => void;
    loading?: boolean;
    error?: unknown;
}) {
    const available = projects.filter((project) => !project.is_archived);
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="sm:max-w-xl">
                <DialogTitle>A little step forward.</DialogTitle>
                <DialogDescription>Add a task to one of your projects.</DialogDescription>
                {loading ? (
                    <div className="py-8 text-center">
                        <Loading />
                    </div>
                ) : error ? (
                    <DisplayError error={error} />
                ) : available.length ? (
                    <TaskForm
                        projects={projects}
                        defaultProject={
                            available.find((project) => project.id === projectId)?.id ??
                            available[0].id
                        }
                        defaultDate={dueDate}
                        onClose={onClose}
                    />
                ) : (
                    <div className="grid gap-4 py-4">
                        <p className="text-sm text-neutral-500">
                            Every task needs a project. Create your first project to get started.
                        </p>
                        <Button
                            onClick={() => {
                                onClose();
                                onCreateProject();
                            }}
                        >
                            Create a project
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
