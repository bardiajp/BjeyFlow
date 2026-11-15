import { useQuery } from '@tanstack/react-query';
import {
    ArrowDown,
    ArrowDownUp,
    ArrowUp,
    CalendarDays,
    CaseSensitive,
    List,
    Plus,
    SlidersHorizontal,
    Settings2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { listTasks } from './api/list';
import { TaskBoard } from './components/board';
import { TaskFilterPanel, type TaskFilterValues } from './components/filter';
import { TaskControlDropdown, TaskControlOption } from './components/control-dropdown';
import { FocusSession } from './components/focus-session';
import { TaskList } from './components/list';
import { WeeklyActivity } from './components/weekly-activity';
import { TaskCalendar } from './components/calendar';
import { TaskViewTabs, type TaskDisplayMode } from './components/view-tabs';
import { useAppData } from './hooks/use-app-data';
import type { TaskFilters, TaskView } from './types';
import DisplayError from '@/components/display-error';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTaskLayout } from '@/layouts/context';
import { addDays, formatCalendarDate, selectedTimeZone } from '@/lib/date';
import { cn } from '@/lib/utils';
import useUserStore from '@/store/use-user-store';
import { WeatherIcon } from '@/components/weather-icon';
import { PageTransition } from '@/components/page-transition';
import { usePreferences } from '@/store/use-preferences';
import { AccentTitle } from '@/components/accent-title';

export default function TasksPage({ view }: { view: TaskView }) {
    const { projectId } = useParams();
    const { today, search, openTask, createTask, editProject } = useTaskLayout();
    const user = useUserStore((state) => state.user);
    const overview = useAppData();
    const defaultView = usePreferences((state) => state.defaultView);
    const taskOrdering = usePreferences((state) => state.taskOrdering);
    const hideCompleted = usePreferences((state) => state.hideCompleted);
    const [mode, setMode] = useState<TaskDisplayMode>(defaultView);
    const [filters, setFilters] = useState<TaskFilterValues>({
        project: '',
        priority: '',
        status: '',
    });
    const [sort, setSort] = useState('');
    const debouncedSearch = useDebouncedValue(search.trim());
    const project = overview.projects.data?.find((project) => project.id === projectId);
    const parameters: TaskFilters = {
        ...(view === 'today' ? { due_date: today } : {}),
        ...(view === 'upcoming'
            ? { due_date_after: addDays(today, 1), due_date_before: addDays(today, 7) }
            : {}),
        project: view === 'project' ? projectId : filters.project || undefined,
        status: view === 'completed' ? 'completed' : filters.status || undefined,
        priority: filters.priority || undefined,
        hide_completed: view !== 'completed' && !filters.status && hideCompleted ? true : undefined,
        search: debouncedSearch || undefined,
        ordering:
            mode === 'board'
                ? 'position,created_at'
                : sort || (view === 'upcoming' ? 'due_date,due_time' : taskOrdering),
    };
    const query = useQuery({
        queryKey: ['tasks', 'list', parameters],
        queryFn: () => listTasks(parameters),
        enabled: view !== 'project' || !!project,
    });
    const all = overview.tasks.data ?? [];
    const todayTasks = all.filter((task) => task.due_date === today);
    const completedToday = todayTasks.filter((task) => task.status === 'completed').length;
    const name = (user?.display_name || user?.username || 'there').split(' ')[0];
    const hour = Number(
        new Intl.DateTimeFormat('en-US', {
            timeZone: selectedTimeZone(),
            hour: 'numeric',
            hourCycle: 'h23',
        }).format(new Date())
    );
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const title =
        view === 'today'
            ? 'A little focus. A lot of possibility.'
            : view === 'inbox'
              ? 'A clear mind starts here.'
              : view === 'upcoming'
                ? 'A little planning. A lot of possibility.'
                : view === 'completed'
                  ? 'Look how far you’ve come.'
                  : (project?.name ?? 'Your project');
    const description =
        view === 'today'
            ? `${greeting}, ${name}. You have ${todayTasks.length} ${todayTasks.length === 1 ? 'task' : 'tasks'} on your list today.`
            : view === 'inbox'
              ? 'All your tasks, together in one quiet place.'
              : view === 'upcoming'
                ? 'Make a little room for what’s coming in the next seven days.'
                : view === 'completed'
                  ? 'Every small step counts. Here’s what you’ve accomplished.'
                  : project?.description || 'One project. A little progress at a time.';
    const filterCount =
        Number(!!filters.priority) +
        Number(!!filters.status && view !== 'completed') +
        Number(!!filters.project && view !== 'project');

    if (view === 'project' && overview.projects.isSuccess && !project)
        return (
            <div className="grid gap-4 py-16">
                <h1 className="text-2xl font-semibold">
                    <AccentTitle>Project not found</AccentTitle>
                </h1>
                <p className="text-sm text-neutral-500">
                    This project may have been removed or isn’t available to your account.
                </p>
                <Link to="/inbox" className="text-sm underline">
                    Back to Inbox
                </Link>
            </div>
        );

    return (
        <div>
            <div className="surface-hero border-primary/20 relative mb-6 overflow-hidden rounded-[24px] border p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-2.5 text-xs font-medium text-slate-500">
                    <span className="flex size-8 items-center justify-center rounded-xl border border-white bg-white/70">
                        <WeatherIcon size={18} className="text-secondary" strokeWidth={1.5} />
                    </span>
                    <span>
                        {formatCalendarDate(today, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                </div>
                <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
                    <div className="min-w-0">
                        <h1 className="text-primary-foreground max-w-3xl text-[26px] leading-[1.15] font-semibold tracking-[-0.04em] lg:text-[32px] 2xl:text-[38px]">
                            <AccentTitle>{title}</AccentTitle>
                        </h1>
                        <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-slate-500 sm:text-sm">
                            {overview.tasks.isPending
                                ? 'Finding a little focus for your day…'
                                : description}
                        </p>
                        {view === 'project' && project && (
                            <Button
                                variant="outline"
                                className="mt-4 h-9 gap-2 rounded-xl text-xs"
                                onClick={() => editProject(project.id)}
                            >
                                <Settings2 size={14} />
                                {project.key} · Project details
                            </Button>
                        )}
                    </div>
                    <div className="w-full shrink-0 rounded-2xl border border-white bg-white/75 p-4 shadow-[0_3px_12px_-8px_#02304730] sm:w-60 xl:w-64">
                        <div className="mb-3 flex justify-between gap-3 text-xs text-slate-500">
                            <span>Your daily progress</span>
                            <span className="text-primary-foreground font-semibold tabular-nums">
                                {completedToday} / {todayTasks.length}
                            </span>
                        </div>
                        <Progress
                            value={completedToday}
                            max={todayTasks.length}
                            label="Daily task progress"
                            className="bg-primary/20 [&>div]:bg-brand"
                        />
                    </div>
                </div>
            </div>
            <div
                className={cn(
                    'grid items-start gap-5 2xl:gap-6',
                    mode === 'list'
                        ? 'xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_310px]'
                        : 'grid-cols-1'
                )}
            >
                <section
                    className="min-w-0 rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-[0_4px_24px_-16px_#02304720] sm:p-5"
                    aria-label="Tasks"
                >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <TaskViewTabs value={mode} onChange={setMode} />
                        <div className="flex items-center gap-2">
                            <TaskControlDropdown
                                label="Filter"
                                description="A little less noise. Find what matters."
                                icon={SlidersHorizontal}
                                active={filterCount > 0}
                                count={filterCount}
                            >
                                <TaskFilterPanel
                                    value={{
                                        ...filters,
                                        project:
                                            view === 'project'
                                                ? (projectId ?? '')
                                                : filters.project,
                                    }}
                                    onChange={setFilters}
                                    projects={overview.projects.data ?? []}
                                    projectFixed={view === 'project'}
                                    completedView={view === 'completed'}
                                />
                            </TaskControlDropdown>
                            <TaskControlDropdown
                                label="Sort"
                                description="Put your tasks in the order that suits you."
                                icon={ArrowDownUp}
                                active={!!sort && mode === 'list'}
                                disabled={mode !== 'list'}
                            >
                                {[
                                    {
                                        value: '',
                                        label: 'Default order',
                                        icon: List,
                                        description: 'The natural order for this view',
                                    },
                                    {
                                        value: 'due_date,due_time',
                                        label: 'Due date',
                                        icon: CalendarDays,
                                        description: 'Upcoming deadlines first',
                                    },
                                    {
                                        value: 'title',
                                        label: 'Title',
                                        icon: CaseSensitive,
                                        description: 'Alphabetically, A to Z',
                                    },
                                    {
                                        value: '-created_at',
                                        label: 'Newest first',
                                        icon: ArrowDown,
                                        description: 'Most recently created',
                                    },
                                    {
                                        value: 'created_at',
                                        label: 'Oldest first',
                                        icon: ArrowUp,
                                        description: 'Start with the earliest tasks',
                                    },
                                ].map((option) => (
                                    <TaskControlOption
                                        key={option.value}
                                        name="task-sort"
                                        value={option.value}
                                        checked={sort === option.value}
                                        onChange={() => setSort(option.value)}
                                        description={option.description}
                                        icon={<option.icon size={15} strokeWidth={1.7} />}
                                    >
                                        {option.label}
                                    </TaskControlOption>
                                ))}
                            </TaskControlDropdown>
                        </div>
                    </div>
                    <DisplayError
                        error={overview.tasks.error || overview.projects.error}
                        onRetry={() => {
                            void overview.tasks.refetch();
                            void overview.projects.refetch();
                        }}
                    />
                    <PageTransition key={mode} waitForAssets={false}>
                        {query.isPending ? (
                            <div className="grid gap-8 py-8" aria-label="Loading tasks">
                                {[0, 1, 2, 3].map((index) => (
                                    <div className="flex items-center gap-4" key={index}>
                                        <Skeleton className="size-6 rounded-full bg-neutral-100" />
                                        <div className="grid flex-1 gap-3">
                                            <Skeleton className="h-4 w-3/4 bg-neutral-100" />
                                            <Skeleton className="h-3 w-1/3 bg-neutral-100" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : query.error ? (
                            <DisplayError
                                error={query.error}
                                onRetry={() => void query.refetch()}
                            />
                        ) : mode === 'calendar' ? (
                            <TaskCalendar
                                tasks={query.data ?? []}
                                today={today}
                                onOpen={openTask}
                            />
                        ) : query.data?.length ? (
                            mode === 'list' ? (
                                <TaskList tasks={query.data} today={today} onOpen={openTask} />
                            ) : (
                                <TaskBoard tasks={query.data} today={today} onOpen={openTask} />
                            )
                        ) : (
                            <div className="grid justify-items-center gap-4 rounded-xl border border-dashed border-neutral-200 px-6 py-14 text-center">
                                <WeatherIcon size={27} className="text-primary" strokeWidth={1.3} />
                                <h2 className="text-lg font-medium">
                                    <AccentTitle>A little breathing room</AccentTitle>
                                </h2>
                                <p className="max-w-xs text-sm leading-relaxed text-neutral-500">
                                    {search || filterCount
                                        ? 'No tasks match your search or filters. Try a little less specific.'
                                        : view === 'completed'
                                          ? 'Your completed tasks will appear here. One small step at a time.'
                                          : 'Nothing on this list yet. Add a task when you’re ready.'}
                                </p>
                                {view !== 'completed' && (
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => createTask(projectId)}
                                    >
                                        <Plus size={15} />
                                        Add a task
                                    </Button>
                                )}
                            </div>
                        )}
                    </PageTransition>
                </section>
                {mode === 'list' && (
                    <aside
                        className="page-fade-in grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-1"
                        aria-label="Your day at a glance"
                    >
                        <FocusSession />
                        <div>
                            <WeeklyActivity tasks={all} today={today} />
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
