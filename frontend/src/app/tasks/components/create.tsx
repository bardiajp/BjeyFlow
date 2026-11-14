import type { Project } from '@/app/projects/types';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { TaskForm } from './form';
import Loading from '@/components/loading';
import DisplayError from '@/components/display-error';
import { ArrowUpRight, FolderPlus, Plus, Waves, X } from 'lucide-react';

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
            <DrawerContent className="bg-workspace max-w-2xl border border-white shadow-[0_16px_80px_-24px_#02304750]">
                <div className="border-primary/20 surface-wash relative -mx-6 -mt-6 mb-6 overflow-hidden border-b px-6 pt-6 pb-8 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 600 100"
                        preserveAspectRatio="none"
                        className="text-primary pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full"
                    >
                        <path
                            d="M0 65Q150 5 300 65T600 65V100H0Z"
                            fill="currentColor"
                            fillOpacity="0.16"
                        />
                        <path
                            d="M0 80Q150 30 300 80T600 80"
                            fill="none"
                            stroke="currentColor"
                            strokeOpacity="0.35"
                        />
                    </svg>
                    <div className="relative mb-6 flex items-center justify-between">
                        <span className="text-primary-foreground/60 flex items-center gap-2 text-[9px] font-semibold tracking-[0.18em]">
                            <Waves size={15} />A LITTLE MORE FLOW
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={onClose}
                            aria-label="Close task creation"
                            className="text-primary-foreground size-8 rounded-xl border border-white/80 bg-white/60 hover:bg-white"
                        >
                            <X size={16} />
                        </Button>
                    </div>
                    <div className="relative flex items-start gap-4">
                        <span className="text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white bg-white/65 shadow-[0_3px_12px_-6px_#02304730]">
                            <Plus size={24} strokeWidth={1.5} />
                        </span>
                        <div className="min-w-0">
                            <DrawerTitle className="text-primary-foreground text-[27px] leading-tight font-semibold tracking-[-0.04em]">
                                Make your next move<span className="text-secondary">.</span>
                            </DrawerTitle>
                            <DrawerDescription className="mt-2 text-xs leading-relaxed text-slate-500">
                                One task. A little clarity. A step closer.
                            </DrawerDescription>
                        </div>
                    </div>
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
                    <div className="border-primary/50 grid justify-items-center gap-4 rounded-2xl border border-dashed bg-white px-6 py-10 text-center">
                        <span className="bg-primary/15 text-primary-foreground flex size-12 items-center justify-center rounded-2xl">
                            <FolderPlus size={22} />
                        </span>
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
                            Create a project
                            <ArrowUpRight size={15} />
                        </Button>
                    </div>
                )}
            </DrawerContent>
        </Drawer>
    );
}
