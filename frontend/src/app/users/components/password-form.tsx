import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { DialogFooter } from '@/components/ui/dialog';
import type { ChangePasswordValues } from '../types';
import { changePasswordSchema, resetPasswordSchema } from '../schema';

export default function PasswordForm({
    ownPassword = false,
    action,
    onClose,
}: {
    ownPassword?: boolean;
    action: (values: ChangePasswordValues) => Promise<unknown>;
    onClose: () => void;
}) {
    const { register, handleSubmit } = useForm<ChangePasswordValues>({
        defaultValues: { current_password: '', new_password: '' },
    });
    const mutation = useMutation({
        mutationFn: (values: ChangePasswordValues) => {
            if (ownPassword) changePasswordSchema.parse(values);
            else resetPasswordSchema.parse(values);
            return action(values);
        },
        onSuccess: () => {
            toast.add({
                type: 'info',
                title: ownPassword ? 'Password changed' : 'Password reset',
                description: ownPassword
                    ? 'Your new password has been saved.'
                    : 'The user can now sign in with the new password.',
            });
            onClose();
        },
    });
    return (
        <form className="grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
            {ownPassword && (
                <LabeledInput
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    {...register('current_password')}
                    required
                    disabled={mutation.isPending}
                />
            )}
            <LabeledInput
                label="New password"
                type="password"
                autoComplete="new-password"
                {...register('new_password')}
                minLength={8}
                required
                disabled={mutation.isPending}
            />
            <DisplayError error={mutation.error} />
            <DialogFooter className="border-input flex-wrap">
                <Button
                    type="button"
                    variant="cancel"
                    onClick={onClose}
                    disabled={mutation.isPending}
                    className="h-9 rounded-xl text-[11px]"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    isPending={mutation.isPending}
                    className="bg-brand h-9 rounded-xl text-[11px] text-white"
                >
                    Save password
                </Button>
            </DialogFooter>
        </form>
    );
}
