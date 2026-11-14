import type { Task } from '../types';
import { CalendarDays } from 'lucide-react';
import { addDays, localDate } from '@/lib/date';
import { cn } from '@/lib/utils';

export function WeeklyActivity({ tasks, today }: { tasks: Task[]; today: string }) {
    const dayOfWeek = new Date(`${today}T12:00:00`).getDay();
    const monday = addDays(today, -((dayOfWeek + 6) % 7));
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, index) => {
        const day = addDays(monday, index);
        const count = tasks.filter(
            (task) =>
                task.status === 'completed' &&
                task.completed_at &&
                localDate(new Date(task.completed_at)) === day
        ).length;
        return { label, day, count };
    });
    const maximum = Math.max(1, ...days.map((day) => day.count));
    const total = days.reduce((sum, day) => sum + day.count, 0);
    const activeDays = days.filter((day) => day.count > 0).length;
    return (
        <section className="surface-focus overflow-hidden rounded-[22px] border border-slate-200/80 p-5 shadow-[0_4px_24px_-16px_#02304720]">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-primary-foreground text-[13px] font-semibold">Weekly rhythm</h2>
                <span className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-white/80 px-2 py-1 text-[9px] text-slate-400">
                    <CalendarDays size={11} />
                    This week
                </span>
            </div>
            <div className="mt-5 mb-6 flex items-end justify-between gap-3">
                <div>
                    <div className="text-primary-foreground text-[38px] leading-none font-semibold tracking-[-0.06em] tabular-nums">
                        {total}
                        <span className="text-primary ml-1 text-xl">.</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">Tasks completed</p>
                </div>
                <div className="border-primary/20 bg-primary/10 rounded-xl border px-3 py-2 text-right">
                    <p className="text-primary-foreground text-sm font-semibold tabular-nums">
                        {activeDays}
                        <span className="text-[10px] font-normal text-slate-400"> / 7</span>
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-400">active days</p>
                </div>
            </div>
            <div
                className="relative isolate grid grid-cols-7 items-end gap-2"
                role="img"
                aria-label={`Weekly completions: ${days.map((day) => `${day.day}: ${day.count}`).join(', ')}`}
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-5 bottom-8 -z-10 flex flex-col justify-between"
                >
                    {[0, 1, 2].map((line) => (
                        <span key={line} className="border-t border-dashed border-slate-200/70" />
                    ))}
                </div>
                {days.map((day) => (
                    <div
                        className="group/day grid min-w-0 gap-2 text-center"
                        key={day.day}
                        title={`${day.label}: ${day.count} completed`}
                    >
                        <span
                            className={cn(
                                'h-3 text-[9px] font-medium text-slate-400 tabular-nums',
                                day.day === today && 'text-primary-foreground'
                            )}
                        >
                            {day.count > 0 ? day.count : ''}
                        </span>
                        <div className="relative flex h-24 items-end rounded-lg bg-slate-100/50">
                            <div
                                className={cn(
                                    'from-primary/70 to-primary/35 w-full rounded-lg bg-gradient-to-t transition-[height,opacity] duration-700 ease-in-out group-hover/day:opacity-75 motion-reduce:transition-none',
                                    day.day === today &&
                                        'from-primary-foreground to-[#23627b] shadow-[0_3px_8px_-3px_#02304740]',
                                    day.count === 0 &&
                                        'from-slate-200/70 to-slate-200/70 shadow-none'
                                )}
                                style={{ height: `${Math.max(4, (day.count / maximum) * 100)}%` }}
                            />
                        </div>
                        <span
                            className={cn(
                                'rounded-md py-1 text-[9px] text-slate-400',
                                day.day === today &&
                                    'bg-primary/20 text-primary-foreground font-semibold'
                            )}
                        >
                            {day.label}
                        </span>
                    </div>
                ))}
            </div>
            <p className="mt-4 flex items-center gap-2 border-t border-slate-200/60 pt-3 text-[10px] leading-relaxed text-slate-400">
                <span aria-hidden="true" className="bg-primary size-1.5 shrink-0 rounded-full" />
                {total
                    ? 'Small steps. A little more flow every day.'
                    : 'Your next small step starts a new rhythm.'}
            </p>
        </section>
    );
}
