import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useMatch } from 'react-router';
import { ProjectEditor } from '@/app/projects/components/create';
import { CreateTaskDrawer } from '@/app/tasks/components/create';
import { TaskDetailDrawer } from '@/app/tasks/components/detail';
import { useAppData } from '@/app/tasks/hooks/use-app-data';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useLocalDate } from '@/hooks/use-local-date';
import { cn } from '@/lib/utils';
import type { TaskLayoutContext } from './context';
import { AppHeader } from './header';
import { AppSidebar } from './sidebar';
import { HelpDialog } from './help';
import { PageTransition } from '@/components/page-transition';

export default function Layout() {
    const location = useLocation();
    const projectRoute = useMatch('/projects/:projectId');
    const { projects, tasks } = useAppData();
    const today = useLocalDate();
    const [search, setSearch] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [projectOpen, setProjectOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [taskCreate, setTaskCreate] = useState<{ projectId?: string; dueDate?: string } | null>(
        null
    );
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [taskDetailOpen, setTaskDetailOpen] = useState(false);
    const openTask = (id: string) => {
        setSelectedTask(id);
        setTaskDetailOpen(true);
    };
    const [helpOpen, setHelpOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const selected = tasks.data?.find((task) => task.id === selectedTask);
    const createTask = (projectId?: string) =>
        setTaskCreate({
            projectId: projectId ?? projectRoute?.params.projectId,
            dueDate: location.pathname === '/today' ? today : undefined,
        });
    const titles: Record<string, string> = {
        '/inbox': 'Inbox',
        '/today': 'Today',
        '/upcoming': 'Upcoming',
        '/completed': 'Completed',
        '/settings': 'Settings',
        '/settings/users': 'User management',
    };
    const title = projectRoute
        ? (projects.data?.find((project) => project.id === projectRoute.params.projectId)?.name ??
          'Project')
        : (titles[location.pathname] ?? 'Today');
    const breadcrumbParents = [
        { label: 'Home', to: '/today' },
        ...(location.pathname === '/settings/users'
            ? [{ label: 'Settings', to: '/settings' }]
            : []),
    ];
    useEffect(() => {
        const handle = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                searchRef.current?.focus();
                return;
            }
            const target = event.target as HTMLElement;
            if (
                target.closest(
                    'input, textarea, select, [contenteditable="true"], [role="dialog"]'
                ) ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey
            )
                return;
            if (event.key.toLowerCase() === 'n') {
                event.preventDefault();
                setTaskCreate({
                    dueDate: location.pathname === '/today' ? today : undefined,
                    projectId: projectRoute?.params.projectId,
                });
            }
            if (event.key === '?') setHelpOpen(true);
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    }, [location.pathname, today, projectRoute?.params.projectId]);
    useEffect(() => {
        document.title = `${title} · BjeyFlow`;
    }, [title]);
    const context: TaskLayoutContext = {
        search,
        today,
        openTask,
        createTask,
        createProject: () => setProjectOpen(true),
    };
    const sidebar = (
        <AppSidebar
            today={today}
            onEditProject={(id) => {
                setMobileOpen(false);
                setEditingProject(id);
            }}
            onNavigate={() => setMobileOpen(false)}
            onCreateProject={() => {
                setMobileOpen(false);
                setProjectOpen(true);
            }}
            onHelp={() => {
                setMobileOpen(false);
                setHelpOpen(true);
            }}
        />
    );
    return (
        <PageTransition>
            <div
                className={cn(
                    'min-h-dvh bg-white text-neutral-950 transition-[grid-template-columns] duration-500 ease-in-out motion-reduce:transition-none lg:grid lg:[--sidebar-width:250px] xl:[--sidebar-width:272px]',
                    collapsed
                        ? 'lg:grid-cols-[0px_minmax(0,1fr)]'
                        : 'lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]'
                )}
            >
                <div
                    className="sticky top-0 hidden h-dvh min-w-0 overflow-hidden lg:block"
                    inert={collapsed}
                    aria-hidden={collapsed}
                >
                    <div
                        className={cn(
                            'w-(--sidebar-width) transition-[transform,opacity] duration-500 ease-in-out motion-reduce:transition-none',
                            collapsed && '-translate-x-full opacity-0'
                        )}
                    >
                        {sidebar}
                    </div>
                </div>
                <div className="min-w-0">
                    <AppHeader
                        title={title}
                        breadcrumbParents={breadcrumbParents}
                        search={search}
                        onSearch={setSearch}
                        searchRef={searchRef}
                        onToggleSidebar={() => {
                            if (window.matchMedia('(min-width: 1024px)').matches)
                                setCollapsed((value) => !value);
                            else setMobileOpen(true);
                        }}
                        onCreateTask={() => createTask()}
                        tasks={tasks.data ?? []}
                        today={today}
                        onOpenTask={openTask}
                    />
                    <main className="min-w-0 px-5 pt-8 pb-12 lg:px-8 xl:px-10">
                        <PageTransition key={location.pathname}>
                            <Outlet context={context} />
                        </PageTransition>
                    </main>
                </div>
                <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                    <DialogContent className="top-0 left-0 h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none p-0 transition-transform duration-500 ease-in-out data-ending-style:-translate-x-full data-starting-style:-translate-x-full motion-reduce:transition-none sm:max-w-72">
                        <DialogTitle className="sr-only">Navigation</DialogTitle>
                        {sidebar}
                    </DialogContent>
                </Dialog>
                <ProjectEditor open={projectOpen} onClose={() => setProjectOpen(false)} />
                {editingProject &&
                    projects.data?.find((project) => project.id === editingProject) && (
                        <ProjectEditor
                            key={editingProject}
                            project={projects.data.find((project) => project.id === editingProject)}
                            onClose={() => setEditingProject(null)}
                        />
                    )}
                <CreateTaskDrawer
                    open={taskCreate !== null}
                    projects={projects.data ?? []}
                    loading={projects.isPending}
                    error={projects.error}
                    projectId={taskCreate?.projectId}
                    dueDate={taskCreate?.dueDate}
                    onClose={() => setTaskCreate(null)}
                    onCreateProject={() => setProjectOpen(true)}
                />
                <TaskDetailDrawer
                    open={taskDetailOpen}
                    task={selected}
                    projects={projects.data ?? []}
                    onClose={() => setTaskDetailOpen(false)}
                    onClosed={() => setSelectedTask(null)}
                />
                {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
            </div>
        </PageTransition>
    );
}
