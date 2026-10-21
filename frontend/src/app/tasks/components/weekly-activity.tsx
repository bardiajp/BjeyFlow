import type { Task } from '../types';
import { addDays, localDate } from '@/lib/date';
import { cn } from '@/lib/utils';

export function WeeklyActivity({ tasks, today }: { tasks: Task[]; today: string }) {
    const dayOfWeek = new Date(`${today}T12:00:00`).getDay();
    const monday = addDays(today, -((dayOfWeek + 6) % 7));
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => {
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
    return (
        <section>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-semibold">A little every day</h2>
                <span className="text-xs text-neutral-500">This week</span>
            </div>
            <div
                className="grid grid-cols-7 items-end gap-3"
                role="img"
                aria-label={`Weekly completions: ${days.map((day) => `${day.day}: ${day.count}`).join(', ')}`}
            >
                {days.map((day) => (
                    <div className="grid gap-3 text-center" key={day.day}>
                        <div className="flex h-20 items-end">
                            <div
                                className={cn(
                                    'w-full rounded-sm bg-neutral-200 transition-[height,background-color,opacity] duration-500 ease-in-out motion-reduce:transition-none',
                                    day.day === today && 'bg-primary',
                                    day.count === 0 && 'opacity-30'
                                )}
                                style={{ height: `${Math.max(7, (day.count / maximum) * 100)}%` }}
                            />
                        </div>
                        <span
                            className={cn(
                                'text-[11px] text-neutral-500 transition-colors duration-500 motion-reduce:transition-none',
                                day.day === today && 'text-primary font-semibold'
                            )}
                        >
                            {day.label}
                        </span>
                    </div>
                ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed">
                {total} {total === 1 ? 'task' : 'tasks'} completed this week. Small steps add up.
            </p>
        </section>
    );
}
