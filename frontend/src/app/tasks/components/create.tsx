import type { Project } from '@/app/projects/types';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { TaskForm } from './form';
import Loading from '@/components/loading';
import DisplayError from '@/components/display-error';

export function CreateTaskDrawer({
    open,
    projects,
    projectId,
    dueDate,
    onClose,
    onCreateProject,
    loading,
    error,
}: {
    open: boolean;
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
        <Drawer
            open={open}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DrawerContent>
                <div className="mb-6 grid gap-2">
                    <DrawerTitle>A little step forward.</DrawerTitle>
                    <DrawerDescription>Add a task to one of your projects.</DrawerDescription>
                </div>
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
            </DrawerContent>
        </Drawer>
    );
}
