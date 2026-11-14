import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { createProject } from '../api/create';
import { updateProject } from '../api/update';
import type { Project } from '../types';
import { ProjectIconPicker } from './icon-picker';
import { ProjectIcon } from './project-icon';
import { projectSchema, type ProjectFormValues } from '../schema';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { LabeledTextarea } from '@/components/form/labeled-textarea';
import { ColorInput } from '@/components/form/color-input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { DialogFooter } from '@/components/ui/dialog';
import { setValidationErrors } from '@/lib/form';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { EditorHeader } from '@/components/editor-header';
import { ArrowUpRight, FolderOpen, Palette, Text } from 'lucide-react';

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
    const queryClient = useQueryClient();
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
            description: project?.description ?? '',
            color: project?.color ?? '#8ECAE6',
            icon: project?.icon ?? 'hash',
        },
    });
    const [name, icon, color] = watch(['name', 'icon', 'color']);
    const mutation = useMutation({
        mutationFn: (values: ProjectFormValues) =>
            project ? updateProject(project.id, values) : createProject(values),
        onSuccess: async (_, values) => {
            toast.add({
                type: project ? 'info' : 'success',
                title: project ? 'Project updated' : 'Project created successfully',
                description: `“${values.name}” has been ${project ? 'updated' : 'created'} successfully.`,
            });
            await queryClient.invalidateQueries({ queryKey: ['projects'] });
            await queryClient.invalidateQueries({ queryKey: ['tasks'] });
            onClose();
        },
    });
    return (
        <Drawer
            open={open}
            swipeDirection="left"
            onOpenChangeComplete={(isOpen) => {
                if (!isOpen) {
                    reset();
                    mutation.reset();
                    onClosed?.();
                }
            }}
            onOpenChange={(open) => {
                if (!open && !mutation.isPending) onClose();
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
                    disabled={mutation.isPending}
                />
                <form
                    className="editor-form grid gap-5"
                    noValidate
                    onSubmit={handleSubmit((values) => {
                        const parsed = projectSchema.safeParse(values);
                        if (!parsed.success)
                            return setValidationErrors(parsed.error.issues, setError);
                        if (!mutation.isPending) mutation.mutate(parsed.data);
                    })}
                >
                    <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-5">
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
                            <LabeledInput
                                label="Project name"
                                autoFocus
                                className="h-11 text-sm"
                                placeholder="Give your idea a name"
                                error={errors.name?.message}
                                {...register('name')}
                            />
                            <LabeledTextarea
                                label="Description"
                                placeholder="What is this project about?"
                                rows={3}
                                className="resize-none text-sm"
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
                                control={control}
                                name="icon"
                                render={({ field }) => (
                                    <ProjectIconPicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={mutation.isPending}
                                    />
                                )}
                            />
                            <div className="border-t border-slate-100 pt-5">
                                <Controller
                                    control={control}
                                    name="color"
                                    render={({ field }) => (
                                        <ColorInput
                                            containerClassName="project-colors"
                                            label="Project color"
                                            {...field}
                                            error={errors.color?.message}
                                            disabled={mutation.isPending}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </fieldset>
                    <DisplayError error={mutation.error} />
                    <DialogFooter className="sticky -bottom-6 z-10 -mx-6 -mb-6 items-center gap-2 border-slate-200/80 bg-white/95 px-6 py-4 shadow-[0_-8px_24px_-16px_#02304730] backdrop-blur-xl sm:-bottom-8 sm:-mx-8 sm:-mb-8 sm:px-8">
                        <span className="mr-auto hidden text-[10px] text-slate-400 sm:block">
                            A little space. A lot of possibility.
                        </span>
                        <Button
                            type="button"
                            variant="cancel"
                            onClick={onClose}
                            disabled={mutation.isPending}
                            className="h-10 rounded-xl border-slate-200 px-5 text-xs text-slate-500"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isPending={mutation.isPending}
                            className="bg-brand h-10 gap-2 rounded-xl px-5 text-xs text-white shadow-[0_4px_12px_-5px_#02304750]"
                        >
                            {project ? 'Save project' : 'Create project'}
                            <ArrowUpRight size={15} />
                        </Button>
                    </DialogFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
