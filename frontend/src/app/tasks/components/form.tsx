import { useMutation } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { usePreferences } from '@/store/use-preferences';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
    ArrowDownIcon,
    EqualIcon,
    ArrowUpIcon,
    FlameIcon,
    ArrowUpRight,
    CalendarDays,
    ListChecks,
    Text,
    CircleCheck,
    CircleDashed,
    Timer,
} from 'lucide-react';
import { ProjectIcon } from '@/app/projects/components/project-icon';
import { cn } from '@/lib/utils';
import type { Project } from '@/app/projects/types';
import { createTask } from '../api/create';
import { updateTask } from '../api/update';
import { useInvalidateTasks } from '../hooks/use-invalidate-tasks';
import { taskSchema, type TaskFormValues } from '../schema';
import type { Task, TaskInput } from '../types';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { LabeledSelect } from '@/components/form/labeled-select';
import { LabeledTextarea } from '@/components/form/labeled-textarea';
import { DatePicker } from '@/components/form/date-picker';
import { TimePicker } from '@/components/form/time-picker';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { setValidationErrors } from '@/lib/form';
import { SubtaskChecklist } from './subtask-checklist';

const priorityOptions = [
    {
        value: 'low',
        label: 'Low',
        icon: ArrowDownIcon,
        color: 'border-emerald-200 bg-emerald-50 text-emerald-700 peer-checked:border-emerald-400 peer-checked:bg-emerald-100',
    },
    {
        value: 'normal',
        label: 'Normal',
        icon: EqualIcon,
        color: 'border-primary/40 bg-primary/10 text-primary-foreground peer-checked:border-primary peer-checked:bg-primary/30',
    },
    {
        value: 'high',
        label: 'High',
        icon: ArrowUpIcon,
        color: 'border-orange-200 bg-orange-50 text-orange-700 peer-checked:border-orange-400 peer-checked:bg-orange-100',
    },
    {
        value: 'urgent',
        label: 'Urgent',
        icon: FlameIcon,
        color: 'border-destructive/25 bg-destructive/5 text-destructive peer-checked:border-destructive peer-checked:bg-destructive/15',
    },
] as const;

export function TaskForm({
    task,
    projects,
    defaultProject = '',
    defaultDate = '',
    onClose,
    children,
}: {
    task?: Task;
    projects: Project[];
    defaultProject?: string;
    defaultDate?: string;
    onClose: () => void;
    children?: ReactNode;
}) {
    const invalidate = useInvalidateTasks();
    const {
        register,
        control,
        handleSubmit,
        watch,
        setError,
        setValue,
        formState: { errors },
    } = useForm<TaskFormValues>({
        defaultValues: {
            title: task?.title ?? '',
            project: task?.project ?? defaultProject,
            description: task?.description ?? '',
            completion_note: task?.completion_note ?? '',
            priority: task?.priority ?? usePreferences.getState().defaultPriority,
            status: task?.status ?? 'todo',
            due_date: task?.due_date ?? defaultDate,
            due_time: task?.due_time?.slice(0, 5) ?? '',
            subtasks: [],
        },
    });
    const { fields, append, remove, move } = useFieldArray({ control, name: 'subtasks' });
    const [subtaskTitle, setSubtaskTitle] = useState('');
    const subtasks = watch('subtasks');
    const checklistItems = fields.map((field, index) => ({ ...field, ...subtasks[index] }));
    const dueDate = watch('due_date');
    const availableProjects = projects.filter(
        (project) => !project.is_archived || project.id === task?.project
    );
    const mutation = useMutation({
        mutationFn: (values: TaskFormValues) => {
            const { subtasks, due_date, due_time, ...rest } = values;
            const body: TaskInput = {
                ...rest,
                due_date: due_date || null,
                due_time: due_time || null,
            };
            return task
                ? updateTask(task.id, body)
                : createTask({
                      ...body,
                      subtasks: subtasks.map((item, position) => ({ ...item, position })),
                  });
        },
        onSuccess: async (data) => {
            toast.add({
                type: 'success',
                title: task ? 'Task updated' : 'Task created',
                description: `${data.identifier} · ${data.title}`,
            });
            await invalidate();
            onClose();
        },
    });

    return (
        <form
            className="editor-form grid gap-5"
            noValidate
            onSubmit={handleSubmit((values) => {
                const parsed = taskSchema.safeParse(
                    !task && subtaskTitle.trim()
                        ? {
                              ...values,
                              subtasks: [
                                  ...values.subtasks,
                                  { title: subtaskTitle.trim(), is_completed: false },
                              ],
                          }
                        : values
                );
                if (!parsed.success) return setValidationErrors(parsed.error.issues, setError);
                if (!mutation.isPending) mutation.mutate(parsed.data);
            })}
        >
            <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-5">
                <div className="grid gap-5 rounded-[22px] border border-slate-200/70 bg-white p-5 shadow-[0_3px_16px_-12px_#02304725]">
                    <div className="text-primary-foreground flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em]">
                        <span className="bg-primary/15 flex size-7 items-center justify-center rounded-lg">
                            <Text size={14} />
                        </span>
                        THE TASK
                        <span className="ml-auto text-[9px] font-normal tracking-normal text-slate-400">
                            Start with the essentials
                        </span>
                    </div>
                    <LabeledInput
                        label={task ? 'Task title' : 'What’s on your mind?'}
                        placeholder="What would you like to do?"
                        autoFocus
                        className="text-primary-foreground h-11 text-sm font-normal placeholder:text-sm placeholder:font-normal"
                        error={errors.title?.message}
                        {...register('title')}
                    />
                    <Controller
                        name="project"
                        control={control}
                        render={({ field: { onChange, ...field } }) => (
                            <LabeledSelect
                                {...field}
                                onValueChange={onChange}
                                label="Project"
                                placeholder="Choose a project"
                                error={errors.project?.message}
                                disabled={mutation.isPending}
                                options={availableProjects.map((project) => ({
                                    value: project.id,
                                    label: `${project.key} · ${project.name}`,
                                    description: project.is_archived
                                        ? 'Archived project'
                                        : `${project.tasks_count} tasks`,
                                    icon: (
                                        <ProjectIcon
                                            name={project.icon}
                                            color={project.color}
                                            size={16}
                                        />
                                    ),
                                }))}
                            />
                        )}
                    />
                    <LabeledTextarea
                        label="Description"
                        placeholder="Add a little context…"
                        {...register('description')}
                    />
                    <LabeledTextarea
                        label="Result (optional)"
                        placeholder="What did you accomplish?"
                        {...register('completion_note')}
                    />
                </div>
                <div className="grid gap-5 rounded-[22px] border border-slate-200/70 bg-white p-5 shadow-[0_3px_16px_-12px_#02304725]">
                    <div className="text-primary-foreground flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em]">
                        <span className="bg-primary/15 flex size-7 items-center justify-center rounded-lg">
                            <CalendarDays size={14} />
                        </span>
                        MAKE A LITTLE PLAN
                        <span className="ml-auto text-[9px] font-normal tracking-normal text-slate-400">
                            At your own pace
                        </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="due_date"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    {...field}
                                    label="Due date"
                                    error={errors.due_date?.message}
                                    disabled={mutation.isPending}
                                    onChange={(value) => {
                                        field.onChange(value);
                                        if (!value) setValue('due_time', '', { shouldDirty: true });
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="due_time"
                            control={control}
                            render={({ field }) => (
                                <TimePicker
                                    {...field}
                                    label="Due time"
                                    error={errors.due_time?.message}
                                    disabled={mutation.isPending || !dueDate}
                                    description={
                                        !dueDate ? 'Choose a date to add a time.' : undefined
                                    }
                                />
                            )}
                        />
                    </div>
                    <fieldset className="min-w-0">
                        <legend className="mb-3 text-[11px] font-medium text-slate-500">
                            How important is it?
                        </legend>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {priorityOptions.map(({ value, label, icon: Icon, color }) => (
                                <label
                                    key={value}
                                    className="min-w-0 flex-1 cursor-pointer has-disabled:cursor-not-allowed"
                                >
                                    <input
                                        type="radio"
                                        value={value}
                                        className="peer sr-only"
                                        {...register('priority')}
                                    />
                                    <span
                                        className={cn(
                                            'peer-focus-visible:outline-ring relative flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[10px] font-medium transition-[background-color,border-color,box-shadow] duration-300 peer-checked:shadow-[0_2px_8px_-4px_#02304730] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-disabled:pointer-events-none peer-disabled:opacity-50 motion-reduce:transition-none [&_.priority-check]:hidden peer-checked:[&_.priority-check]:block',
                                            color
                                        )}
                                    >
                                        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                                        {label}
                                        <svg
                                            className="priority-check absolute top-1.5 right-1.5 size-3 shrink-0"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="m5 12 4 4L19 6"
                                                pathLength={1}
                                                strokeDasharray={1}
                                                strokeDashoffset={1}
                                                className="animate-[priority-check-draw_350ms_ease-out_forwards] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
                                            />
                                        </svg>
                                    </span>
                                </label>
                            ))}
                        </div>
                        {errors.priority && (
                            <p role="alert" className="text-destructive mt-2 text-xs">
                                {errors.priority.message}
                            </p>
                        )}
                    </fieldset>
                    {task && (
                        <Controller
                            name="status"
                            control={control}
                            render={({ field: { onChange, ...field } }) => (
                                <LabeledSelect
                                    {...field}
                                    onValueChange={onChange}
                                    label="Status"
                                    error={errors.status?.message}
                                    disabled={mutation.isPending}
                                    options={[
                                        {
                                            value: 'todo',
                                            label: 'To do',
                                            description: 'A fresh place to start',
                                            icon: <CircleDashed size={16} />,
                                        },
                                        {
                                            value: 'in_progress',
                                            label: 'In progress',
                                            description: 'One thing at a time',
                                            icon: <Timer size={16} className="text-orange-500" />,
                                        },
                                        {
                                            value: 'completed',
                                            label: 'Completed',
                                            description: 'Small wins, real progress',
                                            icon: (
                                                <CircleCheck
                                                    size={16}
                                                    className="text-emerald-600"
                                                />
                                            ),
                                        },
                                    ]}
                                />
                            )}
                        />
                    )}
                </div>
                {!task && (
                    <div className="rounded-[22px] border border-slate-200/70 bg-white p-5 shadow-[0_3px_16px_-12px_#02304725]">
                        <div className="text-primary-foreground mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em]">
                            <span className="bg-primary/15 flex size-7 items-center justify-center rounded-lg">
                                <ListChecks size={14} />
                            </span>
                            SMALL STEPS
                            <span className="ml-auto text-[9px] font-normal tracking-normal text-slate-400">
                                Optional
                            </span>
                        </div>
                        <SubtaskChecklist
                            className="border-t-0 pt-0"
                            items={checklistItems}
                            title={subtaskTitle}
                            onTitleChange={setSubtaskTitle}
                            onAdd={() => {
                                if (!subtaskTitle.trim() || mutation.isPending) return;
                                append(
                                    { title: subtaskTitle.trim(), is_completed: false },
                                    { shouldFocus: false }
                                );
                                setSubtaskTitle('');
                            }}
                            onToggle={(id, completed) => {
                                const index = fields.findIndex((field) => field.id === id);
                                if (index >= 0)
                                    setValue(`subtasks.${index}.is_completed`, completed, {
                                        shouldDirty: true,
                                    });
                            }}
                            onDelete={(id) => {
                                const index = fields.findIndex((field) => field.id === id);
                                if (index >= 0) remove(index);
                            }}
                            onReorder={(_, { from, to }) => move(from, to)}
                            disabled={mutation.isPending}
                            error={
                                errors.subtasks?.root?.message ||
                                errors.subtasks?.find?.((item) => item?.title?.message)?.title
                                    ?.message
                            }
                        />
                    </div>
                )}
            </fieldset>
            {children}
            <DisplayError error={mutation.error} />
            <footer className="sticky -bottom-6 z-10 -mx-6 -mb-6 flex items-center justify-end gap-2 border-t border-slate-200/80 bg-white/95 px-6 py-4 shadow-[0_-8px_24px_-16px_#02304730] backdrop-blur-xl sm:-bottom-8 sm:-mx-8 sm:-mb-8 sm:px-8">
                <span className="mr-auto hidden text-[10px] text-slate-400 sm:block">
                    A small step is still a step.
                </span>
                <Button
                    variant="cancel"
                    type="button"
                    className="h-10 rounded-xl border-slate-200 text-xs text-slate-500"
                    disabled={mutation.isPending}
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    isPending={mutation.isPending}
                    className="bg-brand h-10 gap-2 rounded-xl px-5 text-xs text-white shadow-[0_4px_12px_-5px_#02304750]"
                >
                    {task ? 'Save changes' : 'Create task'}
                    <ArrowUpRight size={15} />
                </Button>
            </footer>
        </form>
    );
}
