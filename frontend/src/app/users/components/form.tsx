import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { createPanelUser, updatePanelUser } from '../api/panel-users';
import { createUserSchema, userSchema } from '../schema';
import type { PanelUser, UpdatePanelUser } from '../types';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import useInvalidateUsers from './use-invalidate-users';

type Values = UpdatePanelUser & { password: string };

export default function UserForm({ user, onClose }: { user?: PanelUser; onClose: () => void }) {
    const invalidate = useInvalidateUsers();
    const { register, handleSubmit } = useForm<Values>({
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
        onSuccess: async () => {
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
                <div className="grid gap-2">
                    <Label htmlFor="user-role">Role</Label>
                    <select
                        id="user-role"
                        className="border-input bg-background h-9 rounded-md border px-3"
                        {...register('role')}
                    >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="superuser">System administrator</option>
                    </select>
                </div>
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
