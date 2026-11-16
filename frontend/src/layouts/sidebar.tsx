import {
    CalendarDays,
    CircleCheck,
    Pencil,
    Inbox,
    Plus,
    Trash2,
    ShieldCheck,
    Target,
    Trophy,
    Sparkles,
    Flame,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { useAppData } from '@/app/tasks/hooks/use-app-data';
import { NavItem } from '@/components/navigation/nav-item';
import { Button } from '@/components/ui/button';
import DisplayError from '@/components/display-error';
import { addDays } from '@/lib/date';
import useUserStore from '@/store/use-user-store';
import { projectIcons } from '@/app/projects/icons';
import { AccountMenu } from './account-menu';
import { WeatherIcon } from '@/components/weather-icon';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { usePreferences } from '@/store/use-preferences';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/api';

function LevelProgress({
    onNavigate,
    joined,
    collapsed,
}: {
    onNavigate?: () => void;
    joined: boolean;
    collapsed: boolean;
}) {
    const reduceMotion = useReducedMotion();
    const [change, setChange] = useState<{ delta: number; levelUp: boolean } | null>(null);
    const previous = useRef<{ total: number; level: number } | null>(null);
    const xp = useQuery({
        queryKey: ['xp'],
        queryFn: async () =>
            (
                await axiosInstance.get<{
                    total_xp: number;
                    level: number;
                    level_xp: number;
                    level_required_xp: number;
                    next_level_total_xp: number;
                    today_xp: number;
                    today_league_eligible_xp: number;
                    daily_league_cap: number;
                    day_streak: number;
                }>('api/xp/')
            ).data,
        refetchInterval: 10_000,
    });

    useEffect(() => {
        if (!xp.data) return;
        const { total_xp: total, level } = xp.data;
        const delta = previous.current === null ? 0 : total - previous.current.total;
        const levelUp = previous.current !== null && level > previous.current.level;
        previous.current = { total, level };
        if (!delta) return;
        const show = window.setTimeout(() => setChange({ delta, levelUp }), 0);
        const hide = window.setTimeout(() => setChange(null), 4000);
        return () => {
            window.clearTimeout(show);
            window.clearTimeout(hide);
        };
    }, [xp.data?.total_xp, xp.data?.level]);

    if (!xp.data)
        return (
            <div className="text-muted-foreground mb-4 px-1 text-center text-[10px]" role="status">
                {xp.isError ? 'Level unavailable' : 'Loading level…'}
            </div>
        );
    const leagueProgress = Math.min(
        100,
        (xp.data.today_league_eligible_xp / xp.data.daily_league_cap) * 100
    );
    const levelProgress = Math.min(100, (xp.data.level_xp / xp.data.level_required_xp) * 100);
    const colors =
        xp.data.level >= 20
            ? {
                  badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
                  bar: 'bg-amber-500',
                  border: 'border-amber-400/50',
              }
            : xp.data.level >= 10
              ? {
                    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200',
                    bar: 'bg-violet-500',
                    border: 'border-violet-400/50',
                }
              : xp.data.level >= 5
                ? {
                      badge: 'bg-emerald-100 text-emerald-700',
                      bar: 'bg-emerald-600',
                      border: 'border-emerald-500/40',
                  }
                : {
                      badge: 'bg-primary/20 text-primary-foreground',
                      bar: 'bg-brand',
                      border: 'border-primary/40',
                  };
    if (collapsed) {
        return (
            <Link
                to="/xp"
                onClick={onNavigate}
                title={`Level ${xp.data.level}`}
                aria-label={`Level ${xp.data.level}, ${xp.data.level_xp} of ${xp.data.level_required_xp} XP to next level`}
                className={cn(
                    'focus-visible:ring-primary mx-auto mb-4 flex size-10 shrink-0 flex-col items-center justify-center rounded-xl focus-visible:ring-2',
                    colors.badge
                )}
            >
                <span className="text-[8px] leading-none font-bold tracking-wide">LVL</span>
                <span className="text-base leading-tight font-bold tabular-nums">
                    {xp.data.level}
                </span>
            </Link>
        );
    }
    return (
        <div
            className={cn(
                'surface-wash relative mb-4 overflow-hidden rounded-2xl border p-3',
                colors.border
            )}
        >
            <div className="flex items-center gap-2">
                <span
                    className={cn(
                        'flex size-10 shrink-0 flex-col items-center justify-center rounded-xl',
                        colors.badge
                    )}
                >
                    <span className="text-[8px] leading-none font-bold tracking-wide">LVL</span>
                    <span className="text-base leading-tight font-bold tabular-nums">
                        {xp.data.level}
                    </span>
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-[10px]">Personal XP</p>
                    <p className="text-primary-foreground text-base leading-tight font-semibold tabular-nums">
                        {xp.data.total_xp}
                    </p>
                </div>
                <span aria-live="polite" aria-atomic="true" className="min-w-0">
                    <AnimatePresence mode="wait">
                        {change !== null && (
                            <motion.span
                                key={`${change.delta}-${xp.data.total_xp}`}
                                initial={reduceMotion ? false : { opacity: 0, y: 5, scale: 0.85 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
                                className={cn(
                                    'block rounded-lg px-2 py-1 text-xs font-semibold tabular-nums',
                                    change.delta > 0
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-orange-100 text-orange-700'
                                )}
                            >
                                {change.levelUp && (
                                    <>
                                        <Sparkles size={12} className="mr-1 inline" />
                                        Level up! ·{' '}
                                    </>
                                )}
                                {change.delta > 0 ? '+' : ''}
                                {change.delta} XP
                            </motion.span>
                        )}
                    </AnimatePresence>
                </span>
            </div>
            <p
                className="text-muted-foreground mt-3 flex items-center gap-1.5 text-[10px]"
                title="Consecutive UTC days with a completed task, including yesterday if today has no activity yet."
            >
                <Flame size={13} className="text-orange-500" /> {xp.data.day_streak} day streak ·
                UTC
            </p>
            <div className="mt-3 flex justify-between gap-2 text-[10px] text-slate-500">
                <span>Level {xp.data.level} progress</span>
                <span className="tabular-nums">
                    {xp.data.level_xp} / {xp.data.level_required_xp} XP
                </span>
            </div>
            <div
                role="progressbar"
                aria-label={`Level ${xp.data.level} progress`}
                aria-valuemin={0}
                aria-valuemax={xp.data.level_required_xp}
                aria-valuenow={xp.data.level_xp}
                className="bg-primary/15 mt-1.5 h-1.5 overflow-hidden rounded-full"
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none',
                        colors.bar
                    )}
                    style={{ width: `${levelProgress}%` }}
                />
            </div>
            {joined && (
                <>
                    <div className="mt-3 flex justify-between gap-2 text-[10px] text-slate-500">
                        <span>League today · UTC</span>
                        <span className="tabular-nums">
                            {xp.data.today_league_eligible_xp} / {xp.data.daily_league_cap} XP
                        </span>
                    </div>
                    <div className="bg-primary/15 mt-1.5 h-1.5 overflow-hidden rounded-full">
                        <div
                            className="bg-brand h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                            style={{ width: `${leagueProgress}%` }}
                        />
                    </div>
                </>
            )}
            <Link
                to="/xp"
                onClick={onNavigate}
                className="text-primary-foreground focus-visible:ring-primary mt-2 inline-block rounded text-[10px] font-medium hover:underline focus-visible:ring-2"
            >
                XP history
            </Link>
        </div>
    );
}

export function AppSidebar({
    today,
    onNavigate,
    onCreateProject,
    onEditProject,
    collapsed = false,
}: {
    today: string;
    onNavigate?: () => void;
    onCreateProject: () => void;
    onEditProject: (id: string) => void;
    collapsed?: boolean;
}) {
    const { projects, tasks } = useAppData();
    const user = useUserStore((state) => state.user);
    const site = useSiteSettings();
    const league = useQuery({
        queryKey: ['league'],
        queryFn: async () => (await axiosInstance.get<{ joined: boolean }>('api/league/')).data,
        refetchInterval: 30_000,
    });
    const name = user?.display_name || user?.username || 'Your account';
    const initials = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
    const hideCompleted = usePreferences((state) => state.hideCompleted);
    const all = tasks.data?.filter((task) => !hideCompleted || task.status !== 'completed');
    return (
        <aside
            data-collapsed={collapsed}
            className={cn(
                'app-sidebar surface-sidebar flex h-full min-h-0 flex-col overflow-hidden border-r border-slate-200/70 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] transition-[padding] duration-700 ease-in-out motion-reduce:transition-none lg:pt-7 lg:pb-4',
                collapsed ? 'px-3' : 'px-4'
            )}
            aria-label="Primary navigation"
        >
            <Link
                to="/today"
                onClick={onNavigate}
                aria-label="BjeyFlow home"
                title={collapsed ? 'BjeyFlow' : undefined}
                className={cn(
                    'focus-visible:ring-primary mb-8 flex shrink-0 items-center gap-2.5 rounded-xl transition-[padding] duration-700 ease-in-out outline-none focus-visible:ring-2 motion-reduce:transition-none',
                    collapsed ? 'px-1' : 'px-2'
                )}
            >
                <span className="flex size-11 shrink-0 items-center justify-center">
                    <img src="/images/ball.svg" alt="" className="size-8 object-contain" />
                </span>
                <span className="sidebar-copy whitespace-nowrap">
                    <span className="text-primary-foreground block text-[22px] leading-tight font-semibold tracking-[-0.8px]">
                        {site.app_name}
                        <span className="text-secondary">.</span>
                    </span>
                    <span className="mt-0.5 block text-[10px] tracking-[0.12em] text-slate-400">
                        A LITTLE MORE FLOW
                    </span>
                </span>
            </Link>
            <LevelProgress
                key={user?.id}
                onNavigate={onNavigate}
                joined={!!league.data?.joined}
                collapsed={collapsed}
            />
            <nav className="grid w-full shrink-0 gap-1" aria-label="Task views">
                <NavItem
                    to="/inbox"
                    collapsed={collapsed}
                    icon={Inbox}
                    label="Inbox"
                    count={all?.length}
                    onNavigate={onNavigate}
                />
                <NavItem
                    to="/today"
                    collapsed={collapsed}
                    icon={WeatherIcon}
                    label="Today"
                    count={all?.filter((task) => task.due_date === today).length}
                    onNavigate={onNavigate}
                />
                <NavItem
                    to="/upcoming"
                    collapsed={collapsed}
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
                    collapsed={collapsed}
                    icon={CircleCheck}
                    label="Completed"
                    onNavigate={onNavigate}
                />
                <NavItem
                    to="/goals"
                    collapsed={collapsed}
                    icon={Target}
                    label="Goals"
                    onNavigate={onNavigate}
                />
                <NavItem
                    to="/league"
                    collapsed={collapsed}
                    icon={Trophy}
                    label="League"
                    onNavigate={onNavigate}
                />
                <NavItem
                    to="/trash"
                    collapsed={collapsed}
                    icon={Trash2}
                    label="Trash"
                    onNavigate={onNavigate}
                />
            </nav>
            {user && user.role !== 'user' && (
                <nav
                    aria-label="Workspace administration"
                    className="mt-4 shrink-0 border-t border-slate-200/70 pt-3"
                >
                    <NavItem
                        to="/admin"
                        collapsed={collapsed}
                        icon={ShieldCheck}
                        label="Administration"
                        onNavigate={onNavigate}
                    />
                </nav>
            )}
            <section className="mt-7 flex min-h-0 w-full flex-1 flex-col">
                <div
                    className={cn(
                        'relative mb-2 flex h-9 shrink-0 items-center border-t border-slate-200/80 px-3'
                    )}
                >
                    <h2
                        className={cn(
                            'sidebar-copy flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] whitespace-nowrap text-slate-400'
                        )}
                    >
                        PROJECTS
                        <span className="h-px w-8 bg-slate-200" />
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Create project"
                        title="Create project"
                        className={cn(
                            'hover:text-primary-foreground absolute size-6 rounded-lg text-slate-400 transition-[left,translate] duration-700 ease-in-out hover:bg-white motion-reduce:transition-none',
                            collapsed
                                ? 'left-1/2 -translate-x-1/2'
                                : 'left-[calc(100%-2.25rem)] translate-x-0'
                        )}
                        onClick={onCreateProject}
                    >
                        <Plus size={16} />
                    </Button>
                </div>
                <div className="min-h-0 min-w-0 [scrollbar-width:thin] overflow-x-hidden overflow-y-auto overscroll-contain">
                    <nav className="grid grid-cols-[minmax(0,1fr)] gap-0.5" aria-label="Projects">
                        {projects.data
                            ?.filter((project) => !project.is_archived)
                            .map((project) => (
                                <div className="group/project relative min-w-0" key={project.id}>
                                    <NavItem
                                        collapsed={collapsed}
                                        to={`/projects/${project.id}`}
                                        icon={
                                            (projectIcons[project.icon] ?? projectIcons.hash).icon
                                        }
                                        iconColor={project.color}
                                        className="min-w-0"
                                        label={project.name}
                                        count={project.tasks_count}
                                        countClassName="group-hover/project:opacity-0 group-focus-within/project:opacity-0"
                                        project
                                        onNavigate={onNavigate}
                                    />
                                    {!collapsed && (
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className="hover:text-primary-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 opacity-0 transition-opacity group-focus-within/project:pointer-events-auto group-focus-within/project:opacity-100 group-hover/project:pointer-events-auto group-hover/project:opacity-100 hover:bg-white"
                                            aria-label={`Edit project: ${project.name}`}
                                            onClick={() => onEditProject(project.id)}
                                        >
                                            <Pencil size={14} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                    </nav>
                    {projects.isPending && !collapsed && (
                        <p className="px-3 py-4 text-xs text-neutral-400">Loading projects…</p>
                    )}
                    <DisplayError error={projects.error} onRetry={() => void projects.refetch()} />
                    {projects.data?.length === 0 && !collapsed && (
                        <p className="px-3 py-3 text-xs text-neutral-400">
                            Use the + above to create your first project.
                        </p>
                    )}
                </div>
            </section>
            <div className="w-full shrink-0 pt-4">
                <AccountMenu
                    collapsed={collapsed}
                    name={name}
                    initials={initials}
                    onNavigate={onNavigate}
                />
            </div>
        </aside>
    );
}
