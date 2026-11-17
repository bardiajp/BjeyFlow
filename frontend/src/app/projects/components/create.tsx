import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import { ArrowUpRight, FolderOpen, Palette, Text, Trash2 } from 'lucide-react';
import { createProject } from '../api/create';
import { updateProject } from '../api/update';
import { deleteProject } from '../api/delete';
import type { Project } from '../types';
import { ProjectIconPicker } from './icon-picker';
import { ProjectIcon } from './project-icon';
import { ColorInput } from '@/components/form/color-input';
import { projectSchema, type ProjectFormValues } from '../schema';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { LabeledTextarea } from '@/components/form/labeled-textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { setValidationErrors } from '@/lib/form';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { EditorHeader } from '@/components/editor-header';
import { InlineConfirm } from '@/components/inline-confirm';
import { FormActions } from '@/components/form-actions';

export function ProjectEditor({
    open = true,
    onClose,
    onClosed,
    project,
}: {
    open?: boolean;
    onClose: () => void;
    onClosed?: () => void;
    project?: Project;
}) {
    const client = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        register,
        control,
        handleSubmit,
        setError,
        reset,
        watch,
        formState: { errors },
    } = useForm<ProjectFormValues>({
        values: {
            name: project?.name ?? '',
            key: project?.key ?? '',
            description: project?.description ?? '',
            color: project?.color ?? '#8ECAE6',
            icon: project?.icon ?? 'hash',
        },
    });
    const [name, icon, color] = watch(['name', 'icon', 'color']);
    const invalidate = () =>
        Promise.all([
            client.invalidateQueries({ queryKey: ['projects'] }),
            client.invalidateQueries({ queryKey: ['tasks'] }),
        ]);
    const mutation = useMutation({
        mutationFn: (values: ProjectFormValues) =>
            project ? updateProject(project.id, values) : createProject(values),
        onSuccess: async (data) => {
            toast.add({
                type: 'success',
                title: project ? 'Project updated' : 'Project created',
                description: `${data.key} · ${data.name}`,
            });
            await invalidate();
            onClose();
        },
    });
    const remove = useMutation({
        mutationFn: deleteProject,
        onSuccess: async (_, id) => {
            toast.add({ type: 'success', title: 'Project deleted' });
            onClose();
            if (location.pathname === `/projects/${id}`) navigate('/inbox', { replace: true });
            await invalidate();
        },
    });
    const busy = mutation.isPending || remove.isPending;

    return (
        <Drawer
            open={open}
            swipeDirection="left"
            onOpenChangeComplete={(isOpen) => {
                if (!isOpen) {
                    reset();
                    mutation.reset();
                    remove.reset();
                    onClosed?.();
                }
            }}
            onOpenChange={(isOpen) => {
                if (!isOpen && !busy) onClose();
            }}
        >
            <DrawerContent className="bg-workspace max-w-2xl border border-white shadow-[0_16px_80px_-24px_#02304750]">
                <EditorHeader
                    title={project ? 'Room for your next chapter' : 'A space for your next idea'}
                    description={
                        project
                            ? 'Fine-tune the details. Keep your ideas flowing.'
                            : 'Bring related tasks together, one small step at a time.'
                    }
                    icon={<FolderOpen size={24} strokeWidth={1.5} />}
                    onClose={onClose}
                    disabled={busy}
                />
                <form
                    className="editor-form grid gap-5"
                    noValidate
                    onSubmit={handleSubmit((values) => {
                        const parsed = projectSchema.safeParse(values);
                        if (!parsed.success)
                            return setValidationErrors(parsed.error.issues, setError);
                        if (!busy) mutation.mutate(parsed.data);
                    })}
                >
                    <fieldset disabled={busy} className="grid min-w-0 gap-5">
                        <div className="relative overflow-hidden rounded-[22px] border border-white bg-white p-5 shadow-[0_3px_16px_-12px_#02304725]">
                            <div
                                className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <div className="mb-4 flex items-center justify-between gap-2 text-[9px] text-slate-400">
                                <span className="font-semibold tracking-[0.12em]">
                                    YOUR PROJECT, AT A GLANCE
                                </span>
                                <span className="rounded-md bg-slate-50 px-2 py-1">
                                    Live preview
                                </span>
                            </div>
                            <div className="flex items-center gap-3.5">
                                <span
                                    className="flex size-14 shrink-0 items-center justify-center rounded-2xl border"
                                    style={{
                                        color,
                                        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
                                        backgroundColor: `color-mix(in srgb, ${color} 12%, var(--card))`,
                                    }}
                                >
                                    <ProjectIcon name={icon} color={color} size={26} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-primary-foreground truncate text-lg font-medium tracking-tight">
                                        {name.trim() || 'Your next idea'}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        {project
                                            ? `${project.tasks_count} tasks · ${project.is_archived ? 'Archived project' : 'Your own little workspace'}`
                                            : 'A fresh start. A little more possibility.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-5 rounded-[22px] border border-slate-200/70 bg-white p-5 shadow-[0_3px_16px_-12px_#02304725]">
                            <div className="text-primary-foreground flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em]">
                                <span className="bg-primary/15 flex size-7 items-center justify-center rounded-lg">
                                    <Text size={14} />
                                </span>
                                THE IDEA
                                <span className="ml-auto text-[9px] font-normal tracking-normal text-slate-400">
                                    Give it a little context
                                </span>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                                <LabeledInput
                                    label="Project name"
                                    placeholder="Give your idea a name"
                                    autoFocus
                                    error={errors.name?.message}
                                    {...register('name')}
                                />
                                <Controller
                                    name="key"
                                    control={control}
                                    render={({ field }) => (
                                        <LabeledInput
                                            {...field}
                                            onChange={(event) =>
                                                field.onChange(event.target.value.toUpperCase())
                                            }
                                            label="Key"
                                            placeholder="FLOW"
                                            maxLength={4}
                                            autoCapitalize="characters"
                                            autoComplete="off"
                                            spellCheck={false}
                                            className="font-mono tracking-wider"
                                            error={errors.key?.message}
                                        />
                                    )}
                                />
                            </div>
                            <p className="text-muted-foreground -mt-3 text-[11px] leading-6">
                                2–4 letters (A–Z), unique in your workspace. Task IDs look like
                                FLOW-1.
                                {project && ' Changing the key updates this project’s task IDs.'}
                            </p>
                            <LabeledTextarea
                                label="Description"
                                placeholder="What is this project about?"
                                rows={3}
                                {...register('description')}
                            />
                        </div>
                        <div className="grid min-w-0 gap-5 rounded-[22px] border border-slate-200/70 bg-white p-5 shadow-[0_3px_16px_-12px_#02304725]">
                            <div className="text-primary-foreground flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em]">
                                <span className="bg-primary/15 flex size-7 items-center justify-center rounded-lg">
                                    <Palette size={14} />
                                </span>
                                MAKE IT YOURS
                                <span className="ml-auto text-[9px] font-normal tracking-normal text-slate-400">
                                    A little personality
                                </span>
                            </div>
                            <Controller
                                name="icon"
                                control={control}
                                render={({ field }) => (
                                    <ProjectIconPicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={busy}
                                    />
                                )}
                            />
                            <div className="border-t border-slate-100 pt-5">
                                <Controller
                                    name="color"
                                    control={control}
                                    render={({ field }) => (
                                        <ColorInput
                                            containerClassName="project-colors"
                                            label="Project color"
                                            {...field}
                                            error={errors.color?.message}
                                            disabled={busy}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </fieldset>
                    <DisplayError error={mutation.error} />
                    {project && (
                        <div className="border-input flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                            <p className="text-muted-foreground max-w-56 text-[11px] leading-6">
                                Only empty projects can be deleted, including tasks in Trash.
                            </p>
                            <InlineConfirm
                                label={`Delete project ${project.name}`}
                                title="Delete project?"
                                description="This permanently deletes the empty project. Move or permanently delete all its tasks first, including tasks in Trash."
                                confirmLabel="Delete project"
                                disabled={busy}
                                onConfirm={() => remove.mutateAsync(project.id)}
                            >
                                <Trash2 size={13} />
                                Delete
                            </InlineConfirm>
                        </div>
                    )}
                    <FormActions className="sticky -bottom-6 z-10 -mx-6 -mb-6 border-t border-slate-200/80 bg-white/95 px-6 py-4 shadow-[0_-8px_24px_-16px_#02304730] backdrop-blur-xl sm:-bottom-8 sm:-mx-8 sm:-mb-8 sm:px-8">
                        <span className="mr-auto hidden text-[10px] text-slate-400 sm:block">
                            A little space. A lot of possibility.
                        </span>
                        <Button
                            type="button"
                            variant="cancel"
                            className="h-10 rounded-xl border-slate-200 px-5 text-xs text-slate-500"
                            disabled={busy}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isPending={mutation.isPending}
                            disabled={remove.isPending}
                            className="bg-brand h-10 gap-2 rounded-xl px-5 text-xs text-white shadow-[0_4px_12px_-5px_#02304750]"
                        >
                            {project ? 'Save changes' : 'Create project'}
                            <ArrowUpRight size={15} />
                        </Button>
                    </FormActions>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
