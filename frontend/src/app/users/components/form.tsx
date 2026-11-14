import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Shield, ShieldCheck, UserRound } from 'lucide-react';
import { createPanelUser, updatePanelUser } from '../api/panel-users';
import { createUserSchema, userSchema } from '../schema';
import type { PanelUser, UpdatePanelUser } from '../types';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { DialogFooter } from '@/components/ui/dialog';
import { LabeledSelect } from '@/components/form/labeled-select';
import useInvalidateUsers from './use-invalidate-users';

type Values = UpdatePanelUser & { password: string };

export default function UserForm({ user, onClose }: { user?: PanelUser; onClose: () => void }) {
    const invalidate = useInvalidateUsers();
    const { register, control, handleSubmit } = useForm<Values>({
        defaultValues: {
            username: user?.username ?? '',
            display_name: user?.display_name ?? '',
            first_name: user?.first_name ?? '',
            last_name: user?.last_name ?? '',
            mobile: user?.mobile ?? '',
            role: user?.role ?? 'user',
            password: '',
        },
    });
    const mutation = useMutation({
        mutationFn: (values: Values) =>
            user
                ? updatePanelUser(user.id, userSchema.parse(values))
                : createPanelUser(createUserSchema.parse(values)),
        onSuccess: async (_, values) => {
            toast.add({
                type: user ? 'info' : 'success',
                title: user ? 'User updated' : 'User created successfully',
                description: `The account for “${values.username}” has been ${user ? 'updated' : 'created'} successfully.`,
            });
            await invalidate();
            onClose();
        },
    });
    return (
        <form className="grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            <fieldset disabled={mutation.isPending} className="grid gap-4">
                <LabeledInput
                    label="Username"
                    {...register('username')}
                    required
                    maxLength={150}
                    autoComplete="off"
                />
                <LabeledInput label="Display name" {...register('display_name')} maxLength={150} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <LabeledInput label="First name" {...register('first_name')} maxLength={150} />
                    <LabeledInput label="Last name" {...register('last_name')} maxLength={150} />
                </div>
                <LabeledInput label="Mobile" type="tel" {...register('mobile')} maxLength={32} />
                <Controller
                    name="role"
                    control={control}
                    render={({ field: { onChange, ...field } }) => (
                        <LabeledSelect
                            {...field}
                            onValueChange={onChange}
                            label="Role"
                            disabled={mutation.isPending}
                            options={[
                                { value: 'user', label: 'User', icon: <UserRound size={16} /> },
                                { value: 'staff', label: 'Staff', icon: <Shield size={16} /> },
                                {
                                    value: 'superuser',
                                    label: 'System administrator',
                                    icon: <ShieldCheck size={16} />,
                                },
                            ]}
                        />
                    )}
                />
                {!user && (
                    <LabeledInput
                        label="Password"
                        type="password"
                        autoComplete="new-password"
                        {...register('password')}
                        minLength={8}
                        required
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
                    {user ? 'Save changes' : 'Create user'}
                </Button>
            </DialogFooter>
        </form>
    );
}
