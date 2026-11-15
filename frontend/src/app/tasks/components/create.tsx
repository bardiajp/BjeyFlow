import type { Project } from '@/app/projects/types';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { TaskForm } from './form';
import Loading from '@/components/loading';
import DisplayError from '@/components/display-error';
import { Plus } from 'lucide-react';
import { EditorHeader } from '@/components/editor-header';
import { usePreferences } from '@/store/use-preferences';

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
    const defaultProject = usePreferences((state) => state.defaultProject);
    return (
        <Drawer
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onClose();
            }}
        >
            <DrawerContent className="bg-workspace max-w-2xl border border-white shadow-[0_16px_80px_-24px_#02304750]">
                <EditorHeader
                    title="Make your next move"
                    description="One task. A little clarity. A step closer."
                    icon={<Plus size={24} strokeWidth={1.5} />}
                    onClose={onClose}
                />
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loading />
                    </div>
                ) : error ? (
                    <DisplayError error={error} />
                ) : available.length ? (
                    <TaskForm
                        projects={projects}
                        defaultProject={
                            available.find((project) => project.id === projectId)?.id ??
                            available.find((project) => project.id === defaultProject)?.id ??
                            available[0].id
                        }
                        defaultDate={dueDate}
                        onClose={onClose}
                    />
                ) : (
                    <div className="border-primary/50 grid justify-items-center gap-4 rounded-2xl border border-dashed bg-white px-6 py-10 text-center">
                        <p className="max-w-sm text-sm leading-relaxed text-slate-500">
                            Every task needs a project. Create your first project to get started.
                        </p>
                        <Button
                            className="bg-brand hover:bg-brand/90 gap-2 rounded-xl text-white"
                            onClick={() => {
                                onClose();
                                onCreateProject();
                            }}
                        >
                            Create project
                        </Button>
                    </div>
                )}
            </DrawerContent>
        </Drawer>
    );
}
