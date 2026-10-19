import type { Task } from '../types';
import { CollapsibleSection } from '@/components/collapsible-section';
import { TaskRow } from './task-row';

export function TaskList({
    tasks,
    today,
    onOpen,
}: {
    tasks: Task[];
    today: string;
    onOpen: (id: string) => void;
}) {
    const incomplete = tasks.filter((task) => task.status !== 'completed');
    const completed = tasks.filter((task) => task.status === 'completed');
    return (
        <div className="grid gap-6">
            <CollapsibleSection title="To do" count={incomplete.length}>
                {incomplete.length ? (
                    incomplete.map((task) => (
                        <TaskRow key={task.id} task={task} onOpen={onOpen} today={today} />
                    ))
                ) : (
                    <p className="py-5 text-sm text-neutral-400">
                        A little breathing room. Nothing left to do here.
                    </p>
                )}
            </CollapsibleSection>
            {completed.length > 0 && (
                <CollapsibleSection title="Completed" count={completed.length}>
                    {completed.map((task) => (
                        <TaskRow key={task.id} task={task} onOpen={onOpen} today={today} />
                    ))}
                </CollapsibleSection>
            )}
        </div>
    );
}
