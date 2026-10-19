import {
    CalendarDays,
    ChevronDown,
    CircleCheck,
    CircleHelp,
    Pencil,
    Inbox,
    Plus,
    SlidersHorizontal,
    Sun,
} from 'lucide-react';
import { Link } from 'react-router';
import ballIcon from '@/assets/ball.svg';
import { useAppData } from '@/app/tasks/hooks/use-app-data';
import { NavItem } from '@/components/navigation/nav-item';
import { Button } from '@/components/ui/button';
import DisplayError from '@/components/display-error';
import { addDays } from '@/lib/date';
import useUserStore from '@/store/use-user-store';
import { projectIcons } from '@/app/projects/icons';

export function AppSidebar({
    today,
    onNavigate,
    onCreateProject,
    onHelp,
    onEditProject,
}: {
    today: string;
    onNavigate?: () => void;
    onCreateProject: () => void;
    onHelp: () => void;
    onEditProject: (id: string) => void;
}) {
    const { projects, tasks } = useAppData();
    const user = useUserStore((state) => state.user);
    const name = user?.display_name || user?.username || 'Your account';
    const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
    const all = tasks.data;
    return (
        <aside
            className="flex h-dvh flex-col overflow-y-auto border-r border-neutral-300 bg-white px-4 pt-7 pb-5"
            aria-label="Primary navigation"
        >
            <Link to="/today" onClick={onNavigate} className="mb-9 flex items-center gap-3 px-3">
                <img src={ballIcon} alt="" className="size-9 object-contain" />
                <span className="text-[27px] font-semibold tracking-tight text-[#252c28]">
                    BjeyFlow
                </span>
            </Link>
            <nav className="grid gap-1.5" aria-label="Task views">
                <NavItem
                    to="/inbox"
                    icon={Inbox}
                    label="Inbox"
                    count={all?.length}
                    onNavigate={onNavigate}
                />
                <NavItem
                    to="/today"
                    icon={Sun}
                    label="Today"
                    count={all?.filter((task) => task.due_date === today).length}
                    onNavigate={onNavigate}
                />
                <NavItem
                    to="/upcoming"
                    icon={CalendarDays}
                    label="Upcoming"
                    count={
                        all?.filter(
                            (task) =>
                                task.due_date &&
                                task.due_date > today &&
                                task.due_date <= addDays(today, 7)
                        ).length
                    }
                    onNavigate={onNavigate}
                />
                <NavItem
                    to="/completed"
                    icon={CircleCheck}
                    label="Completed"
                    onNavigate={onNavigate}
                />
            </nav>
            <section className="mt-8">
                <div className="mb-3 flex items-center justify-between px-3">
                    <h2 className="text-xs font-semibold">MY PROJECTS</h2>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Create project"
                        onClick={onCreateProject}
                    >
                        <Plus size={16} />
                    </Button>
                </div>
                <nav className="grid gap-1" aria-label="Projects">
                    {projects.data
                        ?.filter((project) => !project.is_archived)
                        .map((project) => (
                            <div className="group/project relative" key={project.id}>
                                <NavItem
                                    to={`/projects/${project.id}`}
                                    icon={(projectIcons[project.icon] ?? projectIcons.hash).icon}
                                    iconColor={project.color}
                                    className="min-w-0"
                                    label={project.name}
                                    count={project.tasks_count}
                                    countClassName="group-hover/project:opacity-0 group-focus-within/project:opacity-0"
                                    project
                                    onNavigate={onNavigate}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 opacity-0 transition-opacity group-focus-within/project:pointer-events-auto group-focus-within/project:opacity-100 group-hover/project:pointer-events-auto group-hover/project:opacity-100 hover:bg-transparent"
                                    aria-label={`Edit project: ${project.name}`}
                                    onClick={() => onEditProject(project.id)}
                                >
                                    <Pencil size={14} />
                                </Button>
                            </div>
                        ))}
                </nav>
                {projects.isPending && (
                    <p className="px-3 py-4 text-xs text-neutral-400">Loading projects…</p>
                )}
                <DisplayError error={projects.error} onRetry={() => void projects.refetch()} />
                {projects.data?.length === 0 && (
                    <p className="px-3 py-3 text-xs text-neutral-400">
                        Use the + above to create your first project.
                    </p>
                )}
            </section>
            <div className="mt-auto grid gap-1.5 pt-14">
                <NavItem
                    to="/settings"
                    icon={SlidersHorizontal}
                    label="Settings"
                    project
                    onNavigate={onNavigate}
                />
                <Button
                    variant="ghost"
                    className="h-11 justify-start gap-3 rounded-[10px] bg-[#ebebeb] px-3.5 text-sm font-normal"
                    onClick={onHelp}
                >
                    <CircleHelp size={19} strokeWidth={1.5} />
                    Help & shortcuts
                </Button>
            </div>
            <Link
                to="/settings"
                onClick={onNavigate}
                className="mt-7 flex items-center gap-3 border-t border-neutral-200 px-2 pt-6"
                aria-label={`Account settings for ${name}`}
            >
                <span className="text-secondary flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm">
                    {initials}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                <ChevronDown size={15} />
            </Link>
        </aside>
    );
}
