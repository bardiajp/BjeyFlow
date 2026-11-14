import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { login } from '../api/login';
import { loginSchema, type LoginFormValues } from '../schema';
import AccountHelp from './account-help';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { Checkbox } from '@/components/ui/checkbox';
import useUserStore from '@/store/use-user-store';
import { Waves } from 'lucide-react';
import { AccentTitle } from '@/components/accent-title';

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
            toast.add({
                type: 'success',
                title: 'Welcome back',
                description: 'You have signed in successfully.',
            });
            queryClient.clear();
            queryClient.setQueryData(['status'], data);
            setUser(data.user);
            navigate('/', { replace: true });
        },
    });

    return (
        <form
            className="editor-form flex w-full max-w-[390px] flex-col gap-5"
            aria-labelledby="login-title"
            noValidate
            onSubmit={handleSubmit((values) => {
                if (!mutation.isPending) mutation.mutate(values);
            })}
        >
            <div className="text-muted-foreground mb-1 flex items-center gap-2 text-[9px] font-medium tracking-[0.14em]">
                <Waves size={16} className="text-primary" aria-hidden="true" />
                <span>YOUR SPACE TO FOCUS</span>
            </div>
            <h1
                id="login-title"
                className="text-foreground text-[36px] leading-tight font-semibold tracking-[-0.05em] sm:text-[40px]"
            >
                <AccentTitle>Welcome back</AccentTitle>
            </h1>
            <p className="text-muted-foreground -mt-2 mb-3 max-w-80 text-[13px] leading-relaxed">
                Settle in. Pick up where you left off, one small step at a time.
            </p>
            <LabeledInput
                id="username"
                label="Username"
                className="h-12 font-normal"
                placeholder="Your username"
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
                className="h-12 font-normal"
                placeholder="Your password"
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
                        className="text-muted-foreground cursor-pointer text-[11px]"
                    >
                        Remember me
                    </label>
                </div>
                <AccountHelp
                    topic="password"
                    className="text-foreground focus-visible:ring-primary rounded text-[11px] font-medium outline-none hover:underline focus-visible:ring-2"
                >
                    Forgot password?
                </AccountHelp>
            </div>
            <DisplayError error={mutation.error} />
            <Button
                type="submit"
                className="bg-brand mt-1 h-12 gap-2 rounded-2xl text-[13px] text-white shadow-[0_5px_16px_-8px_#02304760]"
                isPending={mutation.isPending}
            >
                <span className="font-medium">
                    {mutation.isPending ? 'Finding your flow…' : 'Step into your space'}
                </span>
                {!mutation.isPending && <ArrowRight size={15} aria-hidden="true" />}
            </Button>
            <div className="surface-wash border-input mt-1 flex items-center justify-between gap-3 rounded-2xl border p-4">
                <div className="min-w-0">
                    <p className="text-foreground text-xs font-medium">A fresh start?</p>
                    <p className="text-muted-foreground mt-1 text-[10px]">
                        Make a little space of your own.
                    </p>
                </div>
                <Link
                    to="/signup"
                    className="flow-control border-input bg-card text-foreground flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px] font-medium"
                >
                    Sign up
                    <ArrowRight size={12} />
                </Link>
            </div>
        </form>
    );
}
