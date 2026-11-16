import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/api';
import { getAllPages } from '@/lib/pagination';
import { useAppData } from '@/app/tasks/hooks/use-app-data';
import PageLayout from '@/layouts/page';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { LabeledInput } from '@/components/form/labeled';
import { LabeledTextarea } from '@/components/form/labeled-textarea';
import { LabeledSelect } from '@/components/form/labeled-select';
import { DatePicker } from '@/components/form/date-picker';
import { InlineConfirm } from '@/components/inline-confirm';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
    Archive,
    ChevronDown,
    CalendarDays,
    CheckCircle2,
    Flag,
    Plus,
    Sparkles,
    Target,
    Trash2,
} from 'lucide-react';

interface Milestone {
    id: string;
    goal: string;
    title: string;
    progress: number;
    tasks_count: number;
    completed_tasks_count: number;
    is_completed: boolean;
}

interface Goal {
    id: string;
    title: string;
    description: string;
    target_date: string | null;
    is_archived: boolean;
    progress: number;
    milestones: Milestone[];
}

export default function GoalsPage() {
    const reducedMotion = useReducedMotion();
    const queryClient = useQueryClient();
    const { tasks } = useAppData();
    const goals = useQuery({
        queryKey: ['goals'],
        queryFn: async () => (await getAllPages<Goal>('api/goals/')).results,
    });
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [selected, setSelected] = useState<string | null>(null);
    const [milestoneTitle, setMilestoneTitle] = useState('');
    const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
    const [milestoneEditTitle, setMilestoneEditTitle] = useState('');
    const [taskId, setTaskId] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const goal = goals.data?.find((item) => item.id === selected);
    const visibleGoals = goals.data?.filter((item) => showArchived || !item.is_archived) ?? [];
    const activeGoals = goals.data?.filter((item) => !item.is_archived) ?? [];
    const milestones = activeGoals.flatMap((item) => item.milestones);
    const mutation = useMutation({
        mutationFn: async ({
            method,
            url,
            data,
        }: {
            method: 'post' | 'patch';
            url: string;
            data: object;
        }) => (await axiosInstance.request({ method, url, data })).data,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['goals'] }),
                queryClient.invalidateQueries({ queryKey: ['tasks'] }),
            ]);
        },
    });

    function saveGoal(event: FormEvent) {
        event.preventDefault();
        mutation.mutate(
            {
                method: editing && goal ? 'patch' : 'post',
                url: editing && goal ? `api/goals/${goal.id}/` : 'api/goals/',
                data: { title, description, target_date: date || null },
            },
            {
                onSuccess: (saved: Goal) => {
                    setSelected(saved.id);
                    setTitle('');
                    setDescription('');
                    setDate('');
                    setEditing(false);
                    setShowForm(false);
                },
            }
        );
    }

    return (
        <PageLayout title="Goals">
            <section className="surface-hero border-primary/20 relative overflow-hidden rounded-[24px] border p-5 sm:p-7">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full border-[30px] border-white/30"
                />
                <div className="relative">
                    <div>
                        <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-slate-400">
                            <Sparkles size={14} className="text-secondary" /> YOUR BIGGER PICTURE
                        </div>
                        <h2 className="text-primary-foreground text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                            Make room for what matters<span className="text-secondary">.</span>
                        </h2>
                        <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
                            Give your ideas a direction, then find your way forward one milestone at
                            a time.
                        </p>
                    </div>
                </div>
                <div className="relative mt-6 flex flex-wrap gap-2">
                    <span className="rounded-xl border border-white bg-white/70 px-3 py-2 text-xs text-slate-500">
                        <strong className="text-primary-foreground">{activeGoals.length}</strong>{' '}
                        active goals
                    </span>
                    <span className="rounded-xl border border-white bg-white/70 px-3 py-2 text-xs text-slate-500">
                        <strong className="text-primary-foreground">{milestones.length}</strong>{' '}
                        milestones
                    </span>
                    <span className="rounded-xl border border-white bg-white/70 px-3 py-2 text-xs text-slate-500">
                        <strong className="text-primary-foreground">
                            {milestones.filter((item) => item.is_completed).length}
                        </strong>{' '}
                        completed
                    </span>
                </div>
            </section>
            {(goals.isError || tasks.isError || mutation.isError) && (
                <p role="alert" className="text-sm text-red-600">
                    Something went wrong. Please try again.
                </p>
            )}
            <AnimatePresence initial={false}>
                {showForm && (
                    <motion.div
                        key="goal-form"
                        initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.25 }}
                        className="overflow-hidden"
                    >
                        <form
                            onSubmit={saveGoal}
                            className="grid gap-4 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_-16px_#02304720]"
                        >
                            <h2 className="text-primary-foreground font-semibold">
                                {editing ? 'Edit goal' : 'Create a goal'}
                            </h2>
                            <LabeledInput
                                label="Goal title"
                                placeholder="What do you want to achieve?"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                maxLength={255}
                                required
                            />
                            <LabeledTextarea
                                label="Description"
                                placeholder="Description (optional)"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                            <DatePicker
                                label="Target date (optional)"
                                value={date}
                                onChange={setDate}
                            />
                            <div className="flex flex-wrap justify-end gap-2">
                                <Button
                                    type="submit"
                                    className="rounded-xl"
                                    isPending={mutation.isPending}
                                >
                                    {editing ? 'Save changes' : 'Create goal'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setEditing(false);
                                        setTitle('');
                                        setDescription('');
                                        setDate('');
                                        setShowForm(false);
                                    }}
                                    className="text-sm text-slate-500"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-primary-foreground text-lg font-semibold tracking-tight">
                        Your goals
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">A little progress adds up.</p>
                </div>
                <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                    <label className="border-input bg-card text-foreground hover:border-primary/60 focus-within:ring-primary/30 flex h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors focus-within:ring-2 motion-reduce:transition-none">
                        <Checkbox checked={showArchived} onCheckedChange={setShowArchived} />
                        Show archived
                    </label>
                    <Button
                        type="button"
                        className="gap-2 rounded-xl"
                        onClick={() => {
                            setEditing(false);
                            setTitle('');
                            setDescription('');
                            setDate('');
                            setShowForm(true);
                        }}
                    >
                        <Plus size={16} /> Add goal
                    </Button>
                </div>
            </div>
            {goals.isLoading && <p className="text-sm text-slate-500">Loading goals…</p>}
            {goals.isSuccess && visibleGoals.length === 0 && (
                <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center">
                    <span className="bg-primary/10 text-primary-foreground mx-auto flex size-11 items-center justify-center rounded-2xl">
                        <Target size={21} />
                    </span>
                    <h3 className="text-primary-foreground mt-4 font-semibold">
                        {goals.data?.length ? 'No active goals' : 'Start with something meaningful'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                        {goals.data?.length
                            ? 'Show archived to see your archived goals.'
                            : 'Create your first goal and break it into small milestones.'}
                    </p>
                </div>
            )}
            <div className="grid gap-3">
                {visibleGoals.map((item) => (
                    <div key={item.id} className="grid min-w-0 gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setSelected(selected === item.id ? null : item.id)}
                            aria-expanded={selected === item.id}
                            aria-controls={`goal-details-${item.id}`}
                            className={`group block h-auto w-full rounded-[22px] border bg-white p-5 text-left whitespace-normal shadow-[0_4px_24px_-16px_#02304720] transition hover:-translate-y-0.5 hover:border-[#8ecae6] ${selected === item.id ? 'border-[#54a8c3] ring-2 ring-[#8ecae6]/30' : 'border-slate-200/80'}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="bg-primary/10 text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                                    {item.is_archived ? (
                                        <Archive size={18} />
                                    ) : (
                                        <Target size={18} />
                                    )}
                                </span>
                                <ChevronDown
                                    size={18}
                                    className={`text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${selected === item.id ? 'rotate-180' : ''}`}
                                />
                            </div>
                            <div className="mt-4 flex items-start justify-between gap-3">
                                <span className="text-primary-foreground min-w-0 font-semibold wrap-break-word">
                                    {item.title}
                                </span>
                                <span className="text-primary-foreground text-sm font-semibold tabular-nums">
                                    {item.progress}%
                                </span>
                            </div>
                            <p className="mt-1 min-h-4 text-xs text-slate-400">
                                {item.is_archived ? 'Archived · ' : ''}
                                {item.milestones.length} milestones
                                {item.target_date ? ` · ${item.target_date}` : ''}
                            </p>
                            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full bg-[#35a3c5]"
                                    style={{ width: `${item.progress}%` }}
                                />
                            </div>
                        </Button>
                        <AnimatePresence initial={false}>
                            {goal && goal.id === item.id && (
                                <motion.div
                                    id={`goal-details-${item.id}`}
                                    key="details"
                                    initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={
                                        reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }
                                    }
                                    transition={{ duration: reducedMotion ? 0 : 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <section className="grid gap-5 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_-16px_#02304720] sm:p-6">
                                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
                                            <div className="w-full min-w-0 sm:flex-1">
                                                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-slate-400">
                                                    <Flag size={13} /> YOUR ROADMAP
                                                </div>
                                                <h2 className="text-primary-foreground text-xl font-semibold tracking-tight wrap-break-word">
                                                    {goal.title}
                                                </h2>
                                                <p className="mt-1 text-sm break-words text-slate-500">
                                                    {goal.description ||
                                                        'Every milestone brings you a little closer.'}
                                                </p>
                                                {goal.target_date && (
                                                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                                                        <CalendarDays size={13} />{' '}
                                                        {goal.target_date}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
                                                <Button
                                                    variant="outline"
                                                    className="rounded-xl"
                                                    onClick={() => {
                                                        setEditing(true);
                                                        setTitle(goal.title);
                                                        setDescription(goal.description);
                                                        setDate(goal.target_date ?? '');
                                                        setShowForm(true);
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="rounded-xl"
                                                    disabled={mutation.isPending}
                                                    onClick={() =>
                                                        mutation.mutate({
                                                            method: 'patch',
                                                            url: `api/goals/${goal.id}/`,
                                                            data: {
                                                                is_archived: !goal.is_archived,
                                                            },
                                                        })
                                                    }
                                                >
                                                    {goal.is_archived ? 'Restore' : 'Archive'}
                                                </Button>
                                                <InlineConfirm
                                                    label={`Delete goal: ${goal.title}`}
                                                    title="Tasks stay. Delete?"
                                                    description="The goal and its milestones will be deleted. Their tasks will remain in their projects."
                                                    confirmLabel="Delete goal"
                                                    disabled={mutation.isPending}
                                                    onConfirm={async () => {
                                                        await axiosInstance.delete(
                                                            `api/goals/${goal.id}/`
                                                        );
                                                        setSelected(null);
                                                        setEditing(false);
                                                        setShowForm(false);
                                                        await Promise.all([
                                                            queryClient.invalidateQueries({
                                                                queryKey: ['goals'],
                                                            }),
                                                            queryClient.invalidateQueries({
                                                                queryKey: ['tasks'],
                                                            }),
                                                        ]);
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Delete goal
                                                </InlineConfirm>
                                            </div>
                                        </div>
                                        {!goal.is_archived && (
                                            <form
                                                className="flex flex-wrap items-end justify-end gap-2"
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    mutation.mutate(
                                                        {
                                                            method: 'post',
                                                            url: 'api/milestones/',
                                                            data: {
                                                                goal: goal.id,
                                                                title: milestoneTitle,
                                                            },
                                                        },
                                                        { onSuccess: () => setMilestoneTitle('') }
                                                    );
                                                }}
                                            >
                                                <LabeledInput
                                                    containerClassName="min-w-0 flex-1 basis-40"
                                                    label="Milestone title"
                                                    placeholder="New milestone"
                                                    value={milestoneTitle}
                                                    onChange={(event) =>
                                                        setMilestoneTitle(event.target.value)
                                                    }
                                                    maxLength={255}
                                                    required
                                                />
                                                <Button
                                                    type="submit"
                                                    aria-label="Add milestone"
                                                    title="Add milestone"
                                                    className="size-[50px] shrink-0 rounded-xl p-0"
                                                    isPending={mutation.isPending}
                                                >
                                                    <Plus size={20} />
                                                </Button>
                                            </form>
                                        )}
                                        {goal.milestones.map((milestone) => (
                                            <div
                                                key={milestone.id}
                                                className="grid gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 sm:p-5"
                                            >
                                                <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
                                                    <div className="w-full min-w-0 sm:flex-1">
                                                        <strong className="text-primary-foreground flex items-start gap-2 text-sm">
                                                            <CheckCircle2
                                                                size={16}
                                                                className={`mt-0.5 shrink-0 ${milestone.is_completed ? 'text-emerald-500' : 'text-slate-300'}`}
                                                            />
                                                            <span className="min-w-0 wrap-break-word">
                                                                {milestone.title}
                                                            </span>
                                                        </strong>
                                                        <p className="mt-1.5 pl-6 text-xs text-slate-500">
                                                            {milestone.is_completed
                                                                ? 'Completed · '
                                                                : ''}
                                                            {milestone.completed_tasks_count}/
                                                            {milestone.tasks_count} tasks ·{' '}
                                                            {milestone.progress}%
                                                        </p>
                                                    </div>
                                                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
                                                        {!goal.is_archived &&
                                                            editingMilestone !== milestone.id && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    className="rounded-xl"
                                                                    onClick={() => {
                                                                        setEditingMilestone(
                                                                            milestone.id
                                                                        );
                                                                        setMilestoneEditTitle(
                                                                            milestone.title
                                                                        );
                                                                    }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                            )}
                                                        {!goal.is_archived && (
                                                            <InlineConfirm
                                                                label={`Delete milestone: ${milestone.title}`}
                                                                title="Tasks stay. Delete?"
                                                                description="The milestone will be deleted. Its tasks will remain in their projects."
                                                                confirmLabel="Delete milestone"
                                                                disabled={mutation.isPending}
                                                                onConfirm={async () => {
                                                                    await axiosInstance.delete(
                                                                        `api/milestones/${milestone.id}/`
                                                                    );
                                                                    await Promise.all([
                                                                        queryClient.invalidateQueries(
                                                                            { queryKey: ['goals'] }
                                                                        ),
                                                                        queryClient.invalidateQueries(
                                                                            { queryKey: ['tasks'] }
                                                                        ),
                                                                    ]);
                                                                }}
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                                milestone
                                                            </InlineConfirm>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                                                    <div
                                                        className="h-full rounded-full bg-[#35a3c5]"
                                                        style={{ width: `${milestone.progress}%` }}
                                                    />
                                                </div>
                                                {!goal.is_archived &&
                                                    editingMilestone === milestone.id && (
                                                        <form
                                                            className="flex flex-wrap items-end justify-end gap-2"
                                                            onSubmit={(event) => {
                                                                event.preventDefault();
                                                                mutation.mutate(
                                                                    {
                                                                        method: 'patch',
                                                                        url: `api/milestones/${milestone.id}/`,
                                                                        data: {
                                                                            title: milestoneEditTitle,
                                                                        },
                                                                    },
                                                                    {
                                                                        onSuccess: () =>
                                                                            setEditingMilestone(
                                                                                null
                                                                            ),
                                                                    }
                                                                );
                                                            }}
                                                        >
                                                            <LabeledInput
                                                                containerClassName="min-w-0 flex-1 basis-40"
                                                                label="Milestone title"
                                                                value={milestoneEditTitle}
                                                                onChange={(event) =>
                                                                    setMilestoneEditTitle(
                                                                        event.target.value
                                                                    )
                                                                }
                                                                maxLength={255}
                                                                required
                                                            />
                                                            <Button
                                                                type="submit"
                                                                className="rounded-xl"
                                                                isPending={mutation.isPending}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    setEditingMilestone(null)
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </form>
                                                    )}
                                                {tasks.data
                                                    ?.filter(
                                                        (task) => task.milestone === milestone.id
                                                    )
                                                    .map((task) => (
                                                        <div
                                                            className="border-input/70 bg-card flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm text-slate-600"
                                                            key={task.id}
                                                        >
                                                            <span className="min-w-0 flex-1 wrap-break-word">
                                                                {task.status === 'completed'
                                                                    ? '✓'
                                                                    : '○'}{' '}
                                                                {task.title}
                                                            </span>
                                                            {!goal.is_archived && (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-primary-foreground shrink-0 rounded-lg text-xs"
                                                                    onClick={() =>
                                                                        mutation.mutate({
                                                                            method: 'patch',
                                                                            url: `api/tasks/${task.id}/`,
                                                                            data: {
                                                                                milestone: null,
                                                                            },
                                                                        })
                                                                    }
                                                                >
                                                                    Detach
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                {!goal.is_archived && (
                                                    <div className="flex flex-wrap items-end justify-end gap-2">
                                                        <LabeledSelect
                                                            containerClassName="min-w-0 flex-1 basis-40"
                                                            label={`Task for ${milestone.title}`}
                                                            placeholder="Choose a task to attach"
                                                            value={
                                                                taskId.startsWith(
                                                                    `${milestone.id}:`
                                                                )
                                                                    ? taskId.slice(
                                                                          milestone.id.length + 1
                                                                      )
                                                                    : ''
                                                            }
                                                            onValueChange={(value) =>
                                                                setTaskId(
                                                                    `${milestone.id}:${value}`
                                                                )
                                                            }
                                                            options={(tasks.data ?? [])
                                                                .filter((task) => !task.milestone)
                                                                .map((task) => ({
                                                                    value: task.id,
                                                                    label: `${task.identifier} · ${task.title}`,
                                                                }))}
                                                        />
                                                        <Button
                                                            type="button"
                                                            className="h-[54px] shrink-0 rounded-xl"
                                                            disabled={
                                                                !taskId.startsWith(
                                                                    `${milestone.id}:`
                                                                ) ||
                                                                !taskId.slice(
                                                                    milestone.id.length + 1
                                                                ) ||
                                                                mutation.isPending
                                                            }
                                                            onClick={() =>
                                                                mutation.mutate(
                                                                    {
                                                                        method: 'patch',
                                                                        url: `api/tasks/${taskId.slice(milestone.id.length + 1)}/`,
                                                                        data: {
                                                                            milestone: milestone.id,
                                                                        },
                                                                    },
                                                                    {
                                                                        onSuccess: () =>
                                                                            setTaskId(''),
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            Attach
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </section>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </PageLayout>
    );
}
