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
        <section className="py-2">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-semibold">On your schedule</h2>
                <CalendarDays size={18} strokeWidth={1.5} />
            </div>
            <div className="grid gap-6">
                {scheduled.slice(0, 4).map((task, index) => (
                    <button
                        type="button"
                        key={task.id}
                        className="border-l-2 pl-4 text-left"
                        style={{ borderColor: index % 2 ? '#8ECAE6' : '#171717' }}
                        onClick={() => onOpen(task.id)}
                    >
                        <span className="text-xs">{formatTime(task.due_time!)}</span>
                        <span className="mt-1 block text-sm font-medium">{task.title}</span>
                        <span className="mt-1 block text-xs text-neutral-500">
                            {task.project_name}
                        </span>
                    </button>
                ))}
                {!scheduled.length && (
                    <p className="text-sm leading-relaxed text-neutral-400">
                        A little space in your day. Tasks with a due time will appear here.
                    </p>
                )}
            </div>
            <Link
                to="/upcoming"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium"
            >
                View upcoming tasks
                <ArrowRight size={15} />
            </Link>
        </section>
    );
}
