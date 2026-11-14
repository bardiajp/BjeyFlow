import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router';
import type { Task } from '../types';
import { formatTime } from '@/lib/date';

export function Schedule({
    tasks,
    today,
    onOpen,
}: {
    tasks: Task[];
    today: string;
    onOpen: (id: string) => void;
}) {
    const scheduled = tasks
        .filter((task) => task.due_date === today && task.due_time && task.status !== 'completed')
        .sort((a, b) => a.due_time!.localeCompare(b.due_time!));
    return (
        <section className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_-16px_#02304720]">
            <div className="mb-5 flex items-center justify-between gap-2">
                <h2 className="text-primary-foreground text-[13px] font-semibold">
                    On your schedule
                </h2>
                <span className="bg-primary/15 text-primary-foreground flex size-8 items-center justify-center rounded-xl">
                    <CalendarDays size={16} strokeWidth={1.5} />
                </span>
            </div>
            <div className="grid gap-6">
                {scheduled.slice(0, 4).map((task, index) => (
                    <button
                        type="button"
                        key={task.id}
                        className="focus-visible:outline-primary rounded-r-xl border-l-2 py-1 pl-3 text-left transition-colors hover:bg-slate-50"
                        style={{ borderColor: index % 2 ? '#8ECAE6' : '#023047' }}
                        onClick={() => onOpen(task.id)}
                    >
                        <span className="text-primary-foreground text-[10px] font-medium">
                            {formatTime(task.due_time!)}
                        </span>
                        <span className="mt-1 block text-sm font-medium">{task.title}</span>
                        <span className="mt-1 block text-xs text-neutral-500">
                            {task.project_name}
                        </span>
                    </button>
                ))}
                {!scheduled.length && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-xs leading-relaxed text-slate-400">
                        A little space in your day. Tasks with a due time will appear here.
                    </p>
                )}
            </div>
            <Link
                to="/upcoming"
                className="group text-primary-foreground mt-5 inline-flex items-center gap-2 text-xs font-medium"
            >
                View upcoming tasks
                <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                />
            </Link>
        </section>
    );
}
