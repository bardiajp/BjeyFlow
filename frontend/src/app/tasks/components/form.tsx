import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { setValidationErrors } from '@/lib/form';
import { SubtaskChecklist } from './subtask-checklist';

export function TaskForm({
    task,
    projects,
    defaultProject = '',
    defaultDate = '',
    onClose,
}: {
    task?: Task;
    projects: Project[];
    defaultProject?: string;
    defaultDate?: string;
    onClose: () => void;
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
            priority: task?.priority ?? 'normal',
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
        onSuccess: async () => {
            await invalidate();
            onClose();
        },
    });
    return (
        <form
            className="grid gap-5"
            noValidate
            onSubmit={handleSubmit((values) => {
                // Don't silently discard text if Create task is clicked before the +.
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
            <fieldset className="grid gap-5" disabled={mutation.isPending}>
                <LabeledInput
                    label="Task title"
                    placeholder="What would you like to do?"
                    autoFocus
                    className="h-11 text-sm"
                    error={errors.title?.message}
                    {...register('title')}
                />
                <LabeledSelect
                    label="Project"
                    error={errors.project?.message}
                    {...register('project')}
                >
                    <option value="">Choose a project</option>
                    {availableProjects.map((project) => (
                        <option value={project.id} key={project.id}>
                            {project.name}
                            {project.is_archived ? ' (archived)' : ''}
                        </option>
                    ))}
                </LabeledSelect>
                <LabeledTextarea
                    label="Description"
                    placeholder="Add a little context…"
                    {...register('description')}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <LabeledInput
                        label="Due date"
                        type="date"
                        className="h-10 text-sm"
                        error={errors.due_date?.message}
                        {...register('due_date', {
                            onChange: (event) => {
                                if (!event.target.value) setValue('due_time', '');
                            },
                        })}
                    />
                    <LabeledInput
                        label="Due time"
                        type="time"
                        className="h-10 text-sm"
                        disabled={mutation.isPending}
                        readOnly={!dueDate}
                        aria-disabled={!dueDate}
                        error={errors.due_time?.message}
                        {...register('due_time')}
                    />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <LabeledSelect label="Priority" {...register('priority')}>
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </LabeledSelect>
                    {task && (
                        <LabeledSelect label="Status" {...register('status')}>
                            <option value="todo">To do</option>
                            <option value="in_progress">In progress</option>
                            <option value="completed">Completed</option>
                        </LabeledSelect>
                    )}
                </div>
                {!task && (
                    <SubtaskChecklist
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
                            errors.subtasks?.find?.((item) => item?.title?.message)?.title?.message
                        }
                    />
                )}
            </fieldset>
            <DisplayError error={mutation.error} />
            <DialogFooter>
                <Button
                    variant="cancel"
                    type="button"
                    onClick={onClose}
                    disabled={mutation.isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" isPending={mutation.isPending}>
                    {task ? 'Save changes' : 'Create task'}
                </Button>
            </DialogFooter>
        </form>
    );
}
