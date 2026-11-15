import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, KeyRound, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { confirmPasswordReset, requestPasswordReset } from '../api/password-reset';
import { AccentTitle } from '@/components/accent-title';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import useUserStore from '@/store/use-user-store';

export default function PasswordRecovery({ mode }: { mode: 'request' | 'confirm' }) {
    const location = useLocation();
    const navigate = useNavigate();
    const client = useQueryClient();
    const clearUser = useUserStore((state) => state.clearUser);
    const parameters = new URLSearchParams(location.hash.slice(1));
    const uid = parameters.get('uid');
    const token = parameters.get('token');
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors },
    } = useForm({
        defaultValues: { email: '', password: '', confirm: '' },
    });
    const request = useMutation({ mutationFn: requestPasswordReset });
    const confirm = useMutation({
        mutationFn: confirmPasswordReset,
        onSuccess: () => {
            client.clear();
            client.setQueryData(['status'], { user: null });
            clearUser();
            toast.add({
                type: 'success',
                title: 'A fresh start',
                description: 'Your password is updated. Sign in with your new password.',
            });
            navigate('/login', { replace: true });
        },
    });
    const mutation = mode === 'request' ? request : confirm;
    const missingLink = mode === 'confirm' && (!uid || !token);

    return (
        <div className="editor-form flex w-full max-w-[390px] flex-col gap-5">
            <span className="bg-primary/15 text-primary-foreground flex size-12 items-center justify-center rounded-2xl">
                {request.isSuccess ? <MailCheck size={23} /> : <KeyRound size={23} />}
            </span>
            <h1 className="text-foreground text-4xl leading-tight font-semibold tracking-[-0.05em]">
                <AccentTitle>
                    {request.isSuccess
                        ? 'Check your inbox'
                        : mode === 'request'
                          ? 'A fresh start'
                          : 'Your new password'}
                </AccentTitle>
            </h1>
            <p
                className="text-muted-foreground text-sm leading-7"
                role={request.isSuccess ? 'status' : undefined}
            >
                {request.isSuccess
                    ? 'If an active account uses that email, a reset link will arrive shortly. Check your spam folder too. The link is valid for 30 minutes.'
                    : missingLink
                      ? 'This reset link is incomplete. Request a new one to get back to your flow.'
                      : mode === 'request'
                        ? 'Forgot your password? Enter your account email and we’ll send you a secure link to choose a new one.'
                        : 'Choose a strong password you haven’t used here before. Your other sessions will be signed out.'}
            </p>
            {!request.isSuccess && !missingLink && (
                <form
                    className="grid gap-5"
                    noValidate
                    onSubmit={handleSubmit((values) => {
                        if (mutation.isPending) return;
                        if (mode === 'request') request.mutate(values.email.trim());
                        else if (uid && token)
                            confirm.mutate({ uid, token, new_password: values.password });
                    })}
                >
                    {mode === 'request' ? (
                        <LabeledInput
                            id="recovery-email"
                            type="email"
                            label="Email address"
                            autoComplete="email"
                            placeholder="you@example.com"
                            className="h-12"
                            disabled={request.isPending}
                            error={errors.email?.message}
                            {...register('email', {
                                required: 'Enter your email address.',
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: 'Enter a valid email address.',
                                },
                            })}
                        />
                    ) : (
                        <>
                            <LabeledInput
                                id="new-password"
                                type="password"
                                label="New password"
                                autoComplete="new-password"
                                className="h-12"
                                disabled={confirm.isPending}
                                error={errors.password?.message}
                                {...register('password', {
                                    required: 'Choose a new password.',
                                    minLength: { value: 8, message: 'Use at least 8 characters.' },
                                    maxLength: {
                                        value: 128,
                                        message: 'Use no more than 128 characters.',
                                    },
                                })}
                            />
                            <LabeledInput
                                id="confirm-password"
                                type="password"
                                label="Confirm new password"
                                autoComplete="new-password"
                                className="h-12"
                                disabled={confirm.isPending}
                                error={errors.confirm?.message}
                                {...register('confirm', {
                                    required: 'Confirm your new password.',
                                    validate: (value) =>
                                        value === getValues('password') ||
                                        'Your passwords don’t match.',
                                })}
                            />
                        </>
                    )}
                    <DisplayError error={mutation.error} />
                    <Button
                        type="submit"
                        isPending={mutation.isPending}
                        className="bg-brand h-12 gap-2 rounded-2xl text-white"
                    >
                        {mode === 'request' ? 'Send reset link' : 'Save new password'}
                        <ArrowRight size={15} />
                    </Button>
                </form>
            )}
            {mode === 'confirm' && (missingLink || confirm.isError) && (
                <Link
                    to="/forgot-password"
                    className="text-foreground rounded-lg text-sm underline underline-offset-4 focus-visible:ring-2"
                >
                    Request a new reset link
                </Link>
            )}
            <Link
                to="/login"
                className="text-muted-foreground inline-flex min-h-11 items-center gap-2 rounded-lg text-xs hover:underline focus-visible:ring-2"
            >
                <ArrowLeft size={14} /> Back to sign in
            </Link>
        </div>
    );
}
