import { useQuery } from '@tanstack/react-query';
import { ArrowDownUp, Columns3, List, Plus, SlidersHorizontal, Sun } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { listTasks } from './api/list';
import { TaskBoard } from './components/board';
import { TaskFilterPanel, type TaskFilterValues } from './components/filter';
import { FocusSession } from './components/focus-session';
import { TaskList } from './components/list';
import { Schedule } from './components/schedule';
import { WeeklyActivity } from './components/weekly-activity';
import { useAppData } from './hooks/use-app-data';
import type { TaskFilters, TaskView } from './types';
import DisplayError from '@/components/display-error';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTaskLayout } from '@/layouts/context';
import { addDays } from '@/lib/date';
import { cn } from '@/lib/utils';
import useUserStore from '@/store/use-user-store';

export default function TasksPage({ view }: { view: TaskView }) {
    const { projectId } = useParams();
    const { today, search, openTask, createTask } = useTaskLayout();
    const user = useUserStore((state) => state.user);
    const overview = useAppData();
    const [mode, setMode] = useState<'list' | 'board'>('list');
    const [filterOpen, setFilterOpen] = useState(false);
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
        search: debouncedSearch || undefined,
        ordering:
            mode === 'board'
                ? 'position,created_at'
                : sort || (view === 'upcoming' ? 'due_date,due_time' : undefined),
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
    const hour = new Date().getHours();
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
                <h1 className="text-2xl font-semibold">Project not found.</h1>
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
            <div className="mb-6 flex items-center gap-3 text-sm">
                <Sun size={20} className="text-secondary" strokeWidth={1.5} />
                <span>
                    {new Date(`${today}T12:00:00`).toLocaleDateString([], {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                    })}
                </span>
            </div>
            <div className="mb-9 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
                <div className="min-w-0">
                    <h1 className="text-[28px] leading-tight font-semibold tracking-tight lg:text-[34px] 2xl:text-[40px]">
                        {title}
                    </h1>
                    <p className="mt-4 text-sm leading-relaxed lg:text-base">
                        {overview.tasks.isPending
                            ? 'Finding a little focus for your day…'
                            : description}
                    </p>
                </div>
                <div className="w-full shrink-0 sm:w-56 xl:mb-1 xl:w-64">
                    <div className="mb-3 flex justify-between gap-3 text-xs">
                        <span>Your daily progress</span>
                        <span className="font-semibold tabular-nums">
                            {completedToday} / {todayTasks.length}
                        </span>
                    </div>
                    <Progress
                        value={completedToday}
                        max={todayTasks.length}
                        label="Daily task progress"
                    />
                </div>
            </div>
            <div
                className={cn(
                    'grid items-start gap-8 2xl:gap-12',
                    mode === 'list'
                        ? 'xl:grid-cols-[minmax(0,1fr)_290px] 2xl:grid-cols-[minmax(0,1fr)_330px]'
                        : 'grid-cols-1'
                )}
            >
                <section className="min-w-0" aria-label="Tasks">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-6">
                            <button
                                type="button"
                                aria-pressed={mode === 'list'}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 border-transparent pb-5 text-sm',
                                    mode === 'list' && 'border-neutral-900 font-medium'
                                )}
                                onClick={() => setMode('list')}
                            >
                                <List size={18} strokeWidth={1.5} />
                                List
                            </button>
                            <button
                                type="button"
                                aria-pressed={mode === 'board'}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 border-transparent pb-5 text-sm',
                                    mode === 'board' && 'border-neutral-900 font-medium'
                                )}
                                onClick={() => setMode('board')}
                            >
                                <Columns3 size={18} strokeWidth={1.5} />
                                Board
                            </button>
                        </div>
                        <div className="mb-5 flex items-center gap-3 sm:gap-5">
                            <button
                                type="button"
                                aria-expanded={filterOpen}
                                aria-controls="task-filters"
                                className="border-muted flex h-9 w-24 items-center justify-center gap-2 rounded-lg border px-2 text-sm"
                                onClick={() => setFilterOpen(!filterOpen)}
                            >
                                <SlidersHorizontal size={17} strokeWidth={1.5} />
                                Filter
                                {filterCount > 0 && (
                                    <span className="bg-primary/30 rounded-full px-1.5 text-[10px]">
                                        {filterCount}
                                    </span>
                                )}
                            </button>
                            <label className="border-muted flex h-9 w-24 items-center gap-2 rounded-lg border px-2">
                                <ArrowDownUp size={17} strokeWidth={1.5} />
                                <select
                                    aria-label="Sort tasks"
                                    disabled={mode === 'board'}
                                    title={
                                        mode === 'board'
                                            ? 'Board order is controlled by dragging cards.'
                                            : 'Sort tasks'
                                    }
                                    value={sort}
                                    onChange={(event) => setSort(event.target.value)}
                                    className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent text-sm outline-none"
                                >
                                    <option value="">Sort</option>
                                    <option value="due_date,due_time">Due date</option>
                                    <option value="title">Title</option>
                                    <option value="-created_at">Newest first</option>
                                    <option value="created_at">Oldest first</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    {filterOpen && (
                        <div id="task-filters">
                            <TaskFilterPanel
                                value={{
                                    ...filters,
                                    project:
                                        view === 'project' ? (projectId ?? '') : filters.project,
                                }}
                                onChange={setFilters}
                                projects={overview.projects.data ?? []}
                                projectFixed={view === 'project'}
                                completedView={view === 'completed'}
                            />
                        </div>
                    )}
                    <DisplayError
                        error={overview.tasks.error || overview.projects.error}
                        onRetry={() => {
                            void overview.tasks.refetch();
                            void overview.projects.refetch();
                        }}
                    />
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
                        <DisplayError error={query.error} onRetry={() => void query.refetch()} />
                    ) : query.data?.length ? (
                        mode === 'list' ? (
                            <TaskList tasks={query.data} today={today} onOpen={openTask} />
                        ) : (
                            <TaskBoard tasks={query.data} today={today} onOpen={openTask} />
                        )
                    ) : (
                        <div className="grid justify-items-center gap-4 rounded-xl border border-dashed border-neutral-200 px-6 py-14 text-center">
                            <Sun size={27} className="text-primary" strokeWidth={1.3} />
                            <h2 className="text-lg font-medium">A little breathing room.</h2>
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
                </section>
                {mode === 'list' && (
                    <aside
                        className="grid gap-9 sm:grid-cols-2 xl:grid-cols-1 xl:gap-10"
                        aria-label="Your day at a glance"
                    >
                        <FocusSession />
                        <Schedule tasks={all} today={today} onOpen={openTask} />
                        <WeeklyActivity tasks={all} today={today} />
                    </aside>
                )}
            </div>
        </div>
    );
}
