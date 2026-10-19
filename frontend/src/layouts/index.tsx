import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useMatch } from 'react-router';
import { CreateProjectDialog } from '@/app/projects/components/create';
import { CreateTaskDialog } from '@/app/tasks/components/create';
import { TaskDetailDialog } from '@/app/tasks/components/detail';
import { useAppData } from '@/app/tasks/hooks/use-app-data';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useLocalDate } from '@/hooks/use-local-date';
import { cn } from '@/lib/utils';
import type { TaskLayoutContext } from './context';
import { AppHeader } from './header';
import { AppSidebar } from './sidebar';
import { HelpDialog } from './help';
import { RemindersDialog } from './reminders';

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
    const [helpOpen, setHelpOpen] = useState(false);
    const [remindersOpen, setRemindersOpen] = useState(false);
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
        openTask: setSelectedTask,
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
        <div
            className={cn(
                'min-h-dvh bg-white text-neutral-950 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)]',
                collapsed && 'lg:grid-cols-1 xl:grid-cols-1'
            )}
        >
            {!collapsed && <div className="sticky top-0 hidden h-dvh lg:block">{sidebar}</div>}
            <div className="min-w-0">
                <AppHeader
                    title={title}
                    search={search}
                    onSearch={setSearch}
                    searchRef={searchRef}
                    onToggleSidebar={() => {
                        if (window.matchMedia('(min-width: 1024px)').matches)
                            setCollapsed(!collapsed);
                        else setMobileOpen(true);
                    }}
                    onCreateTask={() => createTask()}
                    onReminders={() => setRemindersOpen(true)}
                />
                <main className="min-w-0 px-5 pt-8 pb-12 lg:px-8 xl:px-10">
                    <Outlet context={context} />
                </main>
            </div>
            {mobileOpen && (
                <Dialog open onOpenChange={setMobileOpen}>
                    <DialogContent className="top-0 left-0 h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-72">
                        <DialogTitle className="sr-only">Navigation</DialogTitle>
                        {sidebar}
                    </DialogContent>
                </Dialog>
            )}
            {projectOpen && <CreateProjectDialog onClose={() => setProjectOpen(false)} />}
            {editingProject && projects.data?.find((project) => project.id === editingProject) && (
                <CreateProjectDialog
                    key={editingProject}
                    project={projects.data.find((project) => project.id === editingProject)}
                    onClose={() => setEditingProject(null)}
                />
            )}
            {taskCreate && (
                <CreateTaskDialog
                    projects={projects.data ?? []}
                    loading={projects.isPending}
                    error={projects.error}
                    projectId={taskCreate.projectId}
                    dueDate={taskCreate.dueDate}
                    onClose={() => setTaskCreate(null)}
                    onCreateProject={() => setProjectOpen(true)}
                />
            )}
            {selected && (
                <TaskDetailDialog
                    key={selected.id}
                    task={selected}
                    projects={projects.data ?? []}
                    onClose={() => setSelectedTask(null)}
                />
            )}
            {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
            {remindersOpen && (
                <RemindersDialog
                    tasks={tasks.data ?? []}
                    today={today}
                    onClose={() => setRemindersOpen(false)}
                    onOpenTask={setSelectedTask}
                />
            )}
        </div>
    );
}
