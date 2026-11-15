import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router';
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
import { PageTransition } from '@/components/page-transition';
import { SearchDialog } from './search-dialog';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { usePreferences } from '@/store/use-preferences';

export default function Layout() {
    const location = useLocation();
    const site = useSiteSettings();
    const navigate = useNavigate();
    const projectRoute = useMatch('/projects/:projectId');
    const { projects, tasks } = useAppData();
    const today = useLocalDate();
    const [search, setSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [projectOpen, setProjectOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [editingProjectOpen, setEditingProjectOpen] = useState(false);
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
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const taskId = params.get('task');
        if (!taskId || !tasks.isSuccess) return;
        if (tasks.data.some((task) => task.id === taskId)) {
            setSelectedTask(taskId);
            setTaskDetailOpen(true);
        }
        params.delete('task');
        navigate(
            {
                pathname: location.pathname,
                search: params.toString() ? `?${params}` : '',
                hash: location.hash,
            },
            { replace: true }
        );
    }, [location.search, location.pathname, location.hash, tasks.isSuccess, tasks.data, navigate]);
    usePreferences((state) => state.calendar);
    usePreferences((state) => state.hourCycle);
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
        '/trash': 'Trash',
        '/settings': 'Settings',
        '/settings/users': 'User management',
        '/admin': 'Administration',
        '/admin/users': 'People',
        '/admin/activity': 'Activity',
        '/admin/services': 'Services',
        '/admin/emails': 'Email',
        '/admin/email-templates': 'Email templates',
        '/admin/notification-templates': 'Notification templates',
        '/admin/errors': 'Errors',
        '/admin/settings': 'Workspace settings',
    };
    const title = projectRoute
        ? (projects.data?.find((project) => project.id === projectRoute.params.projectId)?.name ??
          'Project')
        : (titles[location.pathname] ??
          (location.pathname.startsWith('/admin') ? 'Administration' : 'Today'));
    const breadcrumbParents = [
        { label: 'Home', to: '/today' },
        ...(location.pathname === '/settings/users'
            ? [{ label: 'Settings', to: '/settings' }]
            : []),
        ...(location.pathname.startsWith('/admin/')
            ? [{ label: 'Administration', to: '/admin' }]
            : []),
    ];
    useEffect(() => {
        const handle = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setSearchOpen(true);
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
        document.title = `${title} · ${site.app_name}`;
    }, [title, site.app_name]);
    const context: TaskLayoutContext = {
        search,
        today,
        openTask,
        createTask,
        createProject: () => setProjectOpen(true),
        editProject: (id) => {
            setEditingProject(id);
            setEditingProjectOpen(true);
        },
    };
    const sidebar = (compact = false) => (
        <AppSidebar
            collapsed={compact}
            today={today}
            onEditProject={(id) => {
                setMobileOpen(false);
                setEditingProject(id);
                setEditingProjectOpen(true);
            }}
            onNavigate={() => setMobileOpen(false)}
            onCreateProject={() => {
                setMobileOpen(false);
                setProjectOpen(true);
            }}
        />
    );
    return (
        <PageTransition>
            <div
                className={cn(
                    'bg-workspace min-h-dvh text-slate-800 transition-[grid-template-columns] duration-700 ease-in-out motion-reduce:transition-none lg:grid lg:[--sidebar-width:250px] xl:[--sidebar-width:272px]',
                    collapsed
                        ? 'lg:grid-cols-[76px_minmax(0,1fr)]'
                        : 'lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]'
                )}
            >
                <div className="sticky top-0 hidden h-dvh min-w-0 overflow-hidden lg:block">
                    {sidebar(collapsed)}
                </div>
                <div className="flex min-h-dvh min-w-0 flex-col">
                    <AppHeader
                        helpOpen={helpOpen}
                        onHelpOpenChange={setHelpOpen}
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
                    <main className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 sm:pb-6 lg:px-7 xl:px-8">
                        <PageTransition
                            key={
                                location.pathname.startsWith('/admin')
                                    ? '/admin'
                                    : location.pathname
                            }
                            className="flex min-h-0 w-full flex-1 flex-col"
                        >
                            <Outlet context={context} />
                        </PageTransition>
                    </main>
                </div>
                <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                    <DialogContent className="top-0 left-0 block h-dvh max-h-dvh w-72 max-w-[85vw] translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none rounded-tr-[24px] rounded-br-[24px] p-0 transition-transform duration-500 ease-in-out data-ending-style:-translate-x-full data-starting-style:-translate-x-full motion-reduce:transition-none sm:max-w-72">
                        <DialogTitle className="sr-only">Navigation</DialogTitle>
                        {sidebar()}
                    </DialogContent>
                </Dialog>
                <ProjectEditor open={projectOpen} onClose={() => setProjectOpen(false)} />
                <ProjectEditor
                    open={editingProjectOpen}
                    project={projects.data?.find((project) => project.id === editingProject)}
                    onClose={() => setEditingProjectOpen(false)}
                    onClosed={() => setEditingProject(null)}
                />
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
                <SearchDialog
                    open={searchOpen}
                    onOpenChange={setSearchOpen}
                    onOpenTask={(id) => {
                        setSearchOpen(false);
                        openTask(id);
                    }}
                    onSearchAll={(query) => {
                        setSearch(query);
                        setSearchOpen(false);
                        navigate('/inbox');
                    }}
                />
            </div>
        </PageTransition>
    );
}
