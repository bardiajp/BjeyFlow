import { useMutation, useQuery } from '@tanstack/react-query';
import { RotateCcw, Trash2 } from 'lucide-react';
import { listTrash, permanentlyDeleteTask, restoreTask } from './api/trash';
import { useInvalidateTasks } from './hooks/use-invalidate-tasks';
import { AccentTitle } from '@/components/accent-title';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { InlineConfirm } from '@/components/inline-confirm';
import { toast } from '@/components/ui/toast';
import { useTaskLayout } from '@/layouts/context';
import { formatTimestamp } from '@/lib/date';

export default function TrashPage() {
    const { search } = useTaskLayout();
    const invalidate = useInvalidateTasks();
    const query = useQuery({ queryKey: ['tasks', 'trash'], queryFn: listTrash });
    const restore = useMutation({
        mutationFn: restoreTask,
        onSuccess: async () => {
            toast.add({
                type: 'success',
                title: 'Back in your flow',
                description: 'Your task and its subtasks have been restored.',
            });
            await invalidate();
        },
    });
    const remove = useMutation({
        mutationFn: permanentlyDeleteTask,
        onSuccess: async () => {
            toast.add({ type: 'success', title: 'Task permanently deleted' });
            await invalidate();
        },
    });
    const busy = restore.isPending || remove.isPending;
    const tasks = query.data?.filter((task) =>
        `${task.title} ${task.project_name}`.toLowerCase().includes(search.trim().toLowerCase())
    );

    return (
        <div className="mx-auto max-w-4xl">
            <header className="surface-hero border-input mb-6 rounded-3xl border p-6 sm:p-8">
                <span className="text-muted-foreground mb-4 flex items-center gap-2 text-xs">
                    <Trash2 size={16} /> A little room to reconsider
                </span>
                <h1 className="text-foreground text-3xl font-semibold tracking-tight">
                    <AccentTitle>Gone for now. Not forever.</AccentTitle>
                </h1>
                <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-7">
                    Deleted tasks stay here until you restore them or permanently delete them. Their
                    subtasks and progress stay safe too.
                </p>
            </header>
            <section
                aria-label="Deleted tasks"
                className="bg-card border-input rounded-3xl border p-4 sm:p-6"
            >
                <DisplayError error={restore.error} />
                {query.isPending ? (
                    <div className="flex justify-center py-16">
                        <Loading />
                    </div>
                ) : query.error ? (
                    <DisplayError error={query.error} onRetry={() => void query.refetch()} />
                ) : tasks?.length ? (
                    <ul className="divide-border divide-y">
                        {tasks.map((task) => (
                            <li
                                key={task.id}
                                className="flex flex-wrap items-center justify-between gap-4 py-5"
                            >
                                <div className="min-w-0 flex-1 basis-44">
                                    <h2 className="text-foreground text-sm font-medium wrap-break-word">
                                        <AccentTitle trailingDot={false}>{task.title}</AccentTitle>
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {task.identifier} · {task.project_name} ·{' '}
                                        {task.subtasks_count} small steps
                                    </p>
                                    {task.deleted_at && (
                                        <p className="text-muted-foreground mt-2 text-[11px]">
                                            Deleted{' '}
                                            {formatTimestamp(task.deleted_at, {
                                                dateStyle: 'medium',
                                            })}
                                        </p>
                                    )}
                                </div>
                                <div className="flex w-full flex-wrap items-start gap-2 sm:w-auto sm:justify-end">
                                    <Button
                                        variant="outline"
                                        className="gap-2 rounded-xl"
                                        disabled={busy}
                                        onClick={() => restore.mutate(task.id)}
                                    >
                                        <RotateCcw size={14} /> Restore
                                    </Button>
                                    <InlineConfirm
                                        label={`Permanently delete ${task.title}`}
                                        title="Delete for good?"
                                        description="This task and its subtasks will be removed permanently. There’s no undo."
                                        confirmLabel="Delete permanently"
                                        disabled={busy}
                                        onConfirm={() => remove.mutateAsync(task.id)}
                                    >
                                        <Trash2 size={16} />
                                    </InlineConfirm>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="grid justify-items-center gap-4 py-16 text-center">
                        <Trash2 className="text-muted-foreground size-9" strokeWidth={1.3} />
                        <h2 className="text-foreground text-lg font-medium">
                            {search ? 'No matching tasks' : 'Nothing left behind'}
                        </h2>
                        <p className="text-muted-foreground max-w-sm text-sm leading-7">
                            {search
                                ? 'Try another search to find a deleted task.'
                                : 'Deleted tasks will appear here. You can bring them back whenever you’re ready.'}
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
