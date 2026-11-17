import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Waves } from 'lucide-react';
import { useState } from 'react';
import type { Task } from '../types';
import { Button } from '@/components/ui/button';
import {
    addDays,
    formatTime,
    calendarMonthStart,
    calendarParts,
    formatCalendarDate,
    shiftCalendarMonth,
    weekLabels,
} from '@/lib/date';
import { usePreferences } from '@/store/use-preferences';
import { cn } from '@/lib/utils';

const priorityColors: Record<Task['priority'], string> = {
    low: '#059669',
    normal: '#548aa3',
    high: '#ea8613',
    urgent: '#e15465',
};

export function TaskCalendar({
    tasks,
    today,
    onOpen,
    colorBy,
}: {
    tasks: Task[];
    today: string;
    onOpen: (id: string) => void;
    colorBy: 'project' | 'priority';
}) {
    const [selected, setSelected] = useState(today);
    const { weekStart, calendar } = usePreferences();
    const [monthDay, setMonth] = useState(today);
    const month = calendarMonthStart(monthDay);
    const start = addDays(month, -((new Date(`${month}T12:00:00`).getDay() - weekStart + 7) % 7));
    const selectedTasks = tasks
        .filter((task) => task.due_date === selected)
        .sort((a, b) => (a.due_time ?? '').localeCompare(b.due_time ?? ''));
    const unscheduled = tasks.filter((task) => !task.due_date);
    const shiftMonth = (offset: number) => setMonth(shiftCalendarMonth(month, offset));
    const taskColor = (task: Task) =>
        colorBy === 'project' ? task.project_color || '#8ECAE6' : priorityColors[task.priority];

    return (
        <div className="grid min-w-0 gap-5 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-3">
                    <span className="border-primary/20 bg-primary/15 text-primary-foreground flex size-10 items-center justify-center rounded-2xl border">
                        <Waves size={21} strokeWidth={1.5} />
                    </span>
                    <div>
                        <h2 className="text-primary-foreground text-base font-semibold tracking-tight">
                            Your days, in flow<span className="text-secondary">.</span>
                        </h2>
                        <p className="mt-1 text-[10px] text-slate-400">
                            A little space for everything that’s coming.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-xl px-3 text-[10px]"
                        onClick={() => {
                            setSelected(today);
                            setMonth(today);
                        }}
                    >
                        Today
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Previous month"
                        className="size-8 rounded-lg"
                        onClick={() => shiftMonth(-1)}
                    >
                        <ChevronLeft size={15} />
                    </Button>
                    <span
                        aria-live="polite"
                        className="text-primary-foreground min-w-32 text-center text-xs font-medium"
                    >
                        {formatCalendarDate(month, { month: 'long', year: 'numeric' })}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Next month"
                        className="size-8 rounded-lg"
                        onClick={() => shiftMonth(1)}
                    >
                        <ChevronRight size={15} />
                    </Button>
                </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/70">
                <div className="grid grid-cols-7 gap-px border-b border-slate-200/70 bg-slate-50">
                    {weekLabels().map((label) => (
                        <div
                            key={label}
                            className="py-3 text-center text-[9px] font-medium tracking-wide text-slate-400"
                        >
                            {label}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px">
                    {Array.from({ length: 42 }, (_, index) => {
                        const day = addDays(start, index);
                        const dayTasks = tasks.filter((task) => task.due_date === day);
                        const outsideMonth = calendarMonthStart(day) !== month;
                        return (
                            <div
                                key={day}
                                className={cn(
                                    'relative min-h-20 min-w-0 bg-white p-1 transition-colors sm:min-h-28 sm:p-2',
                                    outsideMonth && 'bg-slate-50/90',
                                    day === selected && 'bg-primary/10'
                                )}
                            >
                                <button
                                    type="button"
                                    aria-label={`${formatCalendarDate(day, { dateStyle: 'full' })}, ${dayTasks.length} tasks`}
                                    aria-pressed={day === selected}
                                    aria-current={day === today ? 'date' : undefined}
                                    onClick={() => setSelected(day)}
                                    className={cn(
                                        'focus-visible:ring-primary flex w-full items-center justify-between rounded-lg outline-none focus-visible:ring-2',
                                        outsideMonth ? 'text-slate-300' : 'text-slate-500'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex size-7 items-center justify-center rounded-lg text-[11px] tabular-nums',
                                            day === today && 'bg-brand font-medium text-white',
                                            day === selected &&
                                                day !== today &&
                                                'bg-primary/30 text-primary-foreground'
                                        )}
                                    >
                                        {new Intl.NumberFormat(
                                            calendar === 'persian' ? 'fa-IR' : 'en-US'
                                        ).format(calendarParts(day).day)}
                                    </span>
                                    <span className="hidden pr-1 text-[9px] text-slate-400 tabular-nums sm:block">
                                        {dayTasks.length || ''}
                                    </span>
                                </button>
                                <div className="mt-1 flex flex-wrap gap-1 px-1 sm:hidden">
                                    {dayTasks.slice(0, 3).map((task) => (
                                        <span
                                            key={task.id}
                                            className="size-1 rounded-full"
                                            style={{ backgroundColor: taskColor(task) }}
                                        />
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <span className="text-[7px] leading-none text-slate-400">
                                            +{dayTasks.length - 3}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 hidden min-w-0 space-y-1 sm:block">
                                    {dayTasks.slice(0, 2).map((task) => (
                                        <button
                                            key={task.id}
                                            type="button"
                                            title={`${task.identifier} · ${task.title}`}
                                            onClick={() => onOpen(task.id)}
                                            className="flow-control block w-full min-w-0 truncate rounded-md border px-1.5 py-1 text-left text-[9px]"
                                            style={{
                                                color: '#0f172a',
                                                backgroundColor: `color-mix(in srgb, ${taskColor(task)} 18%, white)`,
                                                borderColor: `color-mix(in srgb, ${taskColor(task)} 45%, white)`,
                                            }}
                                        >
                                            {task.identifier} · {task.title}
                                        </button>
                                    ))}
                                    {dayTasks.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => setSelected(day)}
                                            className="focus-visible:ring-primary rounded px-1.5 text-[8px] text-slate-400 outline-none focus-visible:ring-2"
                                        >
                                            +{dayTasks.length - 2} more
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <section
                className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4"
                aria-label="Selected day tasks"
            >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-primary-foreground flex items-center gap-2 text-xs font-medium">
                        <CalendarDays size={15} />
                        {formatCalendarDate(selected, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </h3>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                        {selectedTasks.length} tasks
                    </span>
                </div>
                {selectedTasks.length ? (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {selectedTasks.map((task) => (
                            <button
                                key={task.id}
                                type="button"
                                onClick={() => onOpen(task.id)}
                                className="flow-control flex min-w-0 items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-3 text-left"
                            >
                                <span
                                    className="size-1.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: taskColor(task) }}
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="text-primary-foreground block truncate text-xs font-medium">
                                        {task.identifier} · {task.title}
                                    </span>
                                    <span className="mt-1 block truncate text-[9px] text-slate-400">
                                        {task.project_name}
                                    </span>
                                </span>
                                {task.due_time && (
                                    <span className="flex shrink-0 items-center gap-1 text-[9px] text-slate-400">
                                        <Clock3 size={11} />
                                        {formatTime(task.due_time)}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="py-3 text-xs text-slate-400">
                        A little breathing room. Nothing scheduled for this day.
                    </p>
                )}
            </section>
            {unscheduled.length > 0 && (
                <section aria-label="Tasks without a due date">
                    <h3 className="mb-3 flex items-center gap-2 text-[10px] font-medium text-slate-400">
                        <Waves size={14} />
                        Floating tasks
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 tabular-nums">
                            {unscheduled.length}
                        </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {unscheduled.slice(0, 6).map((task) => (
                            <button
                                key={task.id}
                                type="button"
                                onClick={() => onOpen(task.id)}
                                className="flow-control max-w-full truncate rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-500"
                                style={{ borderColor: taskColor(task) }}
                            >
                                {task.identifier} · {task.title}
                            </button>
                        ))}
                        {unscheduled.length > 6 && (
                            <span className="self-center text-[9px] text-slate-400">
                                +{unscheduled.length - 6} without a date
                            </span>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
