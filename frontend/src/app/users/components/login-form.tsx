import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { login } from '../api/login';
import { loginSchema, type LoginFormValues } from '../schema';
import AccountHelp from './account-help';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import useUserStore from '@/store/use-user-store';
import { WeatherIcon } from '@/components/weather-icon';

export default function LoginForm() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setUser = useUserStore((state) => state.setUser);
    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        defaultValues: { username: '', password: '', remember_me: true },
    });
    const mutation = useMutation({
        mutationFn: (values: LoginFormValues) => login(loginSchema.parse(values)),
        onSuccess: (data) => {
            queryClient.clear();
            queryClient.setQueryData(['status'], data);
            setUser(data.user);
            navigate('/', { replace: true });
        },
    });

    return (
        <form
            className="flex w-full max-w-170 flex-col gap-6"
            aria-labelledby="login-title"
            noValidate
            onSubmit={handleSubmit((values) => {
                if (!mutation.isPending) mutation.mutate(values);
            })}
        >
            <div className="flex items-center gap-2">
                <WeatherIcon className="text-secondary" aria-hidden="true" />
                <span className="font-semibold">YOUR SPACE TO FOCUS</span>
            </div>
            <h1 id="login-title" className="text-[38px] font-bold">
                Welcome back.
            </h1>
            <p>Sign in to BjeyFlow and pick up where you left off.</p>
            <LabeledInput
                id="username"
                label="Username"
                className="py-6"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-required="true"
                disabled={mutation.isPending}
                error={errors.username?.message}
                {...register('username', {
                    validate: (value) => !!value.trim() || 'Enter your username.',
                })}
            />
            <LabeledInput
                id="password"
                label="Password"
                type="password"
                className="py-6"
                autoComplete="current-password"
                aria-required="true"
                disabled={mutation.isPending}
                error={errors.password?.message}
                {...register('password', { required: 'Enter your password.' })}
            />
            <div className="flex justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Controller
                        name="remember_me"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                id="remember-me"
                                className="h-[17px] w-[17px]"
                                name={field.name}
                                checked={field.value ?? false}
                                onCheckedChange={(checked) => field.onChange(checked)}
                                onBlur={field.onBlur}
                                ref={field.ref}
                                disabled={mutation.isPending}
                            />
                        )}
                    />
                    <label
                        htmlFor="remember-me"
                        className="text-muted cursor-pointer text-xs font-semibold"
                    >
                        Remember me
                    </label>
                </div>
                <AccountHelp topic="password" className="text-muted font-semibold">
                    Forgot password?
                </AccountHelp>
            </div>
            <DisplayError error={mutation.error} />
            <Button type="submit" className="gap-2 py-6" isPending={mutation.isPending}>
                <span className="font-bold">{mutation.isPending ? 'Signing in…' : 'Sign in'}</span>
                {!mutation.isPending && <ArrowRight size={15} aria-hidden="true" />}
            </Button>
            <p className="text-muted w-full text-center font-semibold">
                Need an account?{' '}
                <AccountHelp className="text-muted font-semibold underline">
                    Contact your administrator
                </AccountHelp>
            </p>
        </form>
    );
}
