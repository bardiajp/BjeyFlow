import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { login } from '../api/login';
import { loginSchema, type LoginFormValues } from '../schema';
import AccountHelp from './account-help';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import useUserStore from '@/store/use-user-store';

export default function LoginForm() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setUser = useUserStore((state) => state.setUser);
    const {
        register,
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
        <div className="login-form-content">
            <div className="login-eyebrow">
                <Sparkles aria-hidden="true" />
                <span>Your space to focus</span>
            </div>
            <h1 id="login-title">Welcome back.</h1>
            <p className="login-intro">Sign in to BjeyFlow and pick up where you left off.</p>
            <form
                className="login-form"
                noValidate
                onSubmit={handleSubmit((values) => mutation.mutate(values))}
            >
                <fieldset disabled={mutation.isPending}>
                    <LabeledInput
                        label="Username"
                        containerClassName="login-field"
                        id="username"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder="Your username"
                        aria-required="true"
                        error={errors.username?.message}
                        {...register('username', {
                            validate: (value) => !!value.trim() || 'Enter your username.',
                        })}
                    />
                    <LabeledInput
                        label="Password"
                        containerClassName="login-field"
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        aria-required="true"
                        error={errors.password?.message}
                        {...register('password', { required: 'Enter your password.' })}
                    />
                    <div className="login-options">
                        <label className="login-remember">
                            <input type="checkbox" {...register('remember_me')} />
                            <span>Remember me</span>
                        </label>
                        <AccountHelp topic="password" className="login-text-button">
                            Forgot password?
                        </AccountHelp>
                    </div>
                </fieldset>
                <DisplayError error={mutation.error} />
                <Button type="submit" className="login-submit" isPending={mutation.isPending}>
                    {mutation.isPending ? 'Signing in…' : 'Sign in'}
                    {!mutation.isPending && <ArrowRight aria-hidden="true" />}
                </Button>
            </form>
            <p className="login-account-note">
                Need an account?{' '}
                <AccountHelp className="login-text-button">Contact your administrator</AccountHelp>
            </p>
        </div>
    );
}
