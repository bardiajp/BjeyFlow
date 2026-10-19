import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { createProject } from '../api/create';
import { updateProject } from '../api/update';
import type { Project } from '../types';
import { ProjectIconPicker } from './icon-picker';
import { projectSchema, type ProjectFormValues } from '../schema';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { LabeledTextarea } from '@/components/form/labeled-textarea';
import { ColorInput } from '@/components/form/color-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { setValidationErrors } from '@/lib/form';

export function CreateProjectDialog({
    onClose,
    project,
}: {
    onClose: () => void;
    project?: Project;
}) {
    const queryClient = useQueryClient();
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<ProjectFormValues>({
        defaultValues: {
            name: project?.name ?? '',
            description: project?.description ?? '',
            color: project?.color ?? '#8ECAE6',
            icon: project?.icon ?? 'hash',
        },
    });
    const mutation = useMutation({
        mutationFn: (values: ProjectFormValues) =>
            project ? updateProject(project.id, values) : createProject(values),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['projects'] });
            await queryClient.invalidateQueries({ queryKey: ['tasks'] });
            onClose();
        },
    });
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !mutation.isPending) onClose();
            }}
        >
            <DialogContent>
                <DialogTitle>
                    {project ? 'Edit project' : 'A little space for your next idea.'}
                </DialogTitle>
                <DialogDescription>
                    {project
                        ? 'Update your project details, color, and icon.'
                        : 'Create a project to keep related tasks together.'}
                </DialogDescription>
                <form
                    className="grid gap-5"
                    noValidate
                    onSubmit={handleSubmit((values) => {
                        const parsed = projectSchema.safeParse(values);
                        if (!parsed.success)
                            return setValidationErrors(parsed.error.issues, setError);
                        if (!mutation.isPending) mutation.mutate(parsed.data);
                    })}
                >
                    <fieldset disabled={mutation.isPending} className="grid gap-5">
                        <LabeledInput
                            label="Project name"
                            autoFocus
                            className="h-10 text-sm"
                            error={errors.name?.message}
                            {...register('name')}
                        />
                        <LabeledTextarea
                            label="Description"
                            placeholder="What is this project about?"
                            {...register('description')}
                        />
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
                        <Controller
                            control={control}
                            name="color"
                            render={({ field }) => (
                                <ColorInput
                                    label="Project color"
                                    {...field}
                                    error={errors.color?.message}
                                    disabled={mutation.isPending}
                                />
                            )}
                        />
                    </fieldset>
                    <DisplayError error={mutation.error} />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="cancel"
                            onClick={onClose}
                            disabled={mutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isPending={mutation.isPending}>
                            {project ? 'Save project' : 'Create project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
