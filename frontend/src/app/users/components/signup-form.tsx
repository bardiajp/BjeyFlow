import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Clock3,
    Mail,
    Moon,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Sun,
    Waves,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import {
    resendSignupCode,
    startSignup,
    verifySignupCode,
    type SignupChallenge,
} from '../api/signup';
import { signupIdentitySchema, signupSchema, type SignupFormValues } from '../schema';
import { AccentTitle } from '@/components/accent-title';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { LabeledTextarea } from '@/components/form/labeled-textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { setValidationErrors } from '@/lib/form';
import { cn } from '@/lib/utils';
import useUserStore from '@/store/use-user-store';
import { useSiteSettings } from '@/hooks/use-site-settings';

export default function SignupForm() {
    const navigate = useNavigate();
    const site = useSiteSettings();
    const queryClient = useQueryClient();
    const setUser = useUserStore((state) => state.setUser);
    const [step, setStep] = useState(0);
    const [challenge, setChallenge] = useState<SignupChallenge | null>(null);
    const [code, setCode] = useState('');
    const [now, setNow] = useState(Date.now);
    const codeRef = useRef<HTMLInputElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const {
        register,
        getValues,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<SignupFormValues>({
        defaultValues: {
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            flow_name: '',
            focus_style: 'steady_tide',
            north_star: '',
            workspace_name: 'My first ripple',
        },
    });

    useEffect(() => {
        if (step !== 2) {
            headingRef.current?.focus();
            return;
        }
        codeRef.current?.focus();
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [step]);

    const start = useMutation({
        mutationFn: startSignup,
        onSuccess: (data) => {
            setChallenge(data);
            setCode('');
            setNow(Date.now());
            setStep(2);
        },
        onError: (error) => {
            if (
                !isAxiosError<Record<string, string | string[]>>(error) ||
                error.response?.status !== 400
            )
                return;
            const values = getValues();
            for (const [key, message] of Object.entries(error.response.data)) {
                if (key in values)
                    setError(key as keyof SignupFormValues, {
                        message: Array.isArray(message) ? message.join(' ') : message,
                    });
                if (
                    [
                        'username',
                        'email',
                        'password',
                        'first_name',
                        'last_name',
                        'non_field_errors',
                    ].includes(key)
                )
                    setStep(0);
            }
        },
    });
    const verify = useMutation({
        mutationFn: verifySignupCode,
        onSuccess: (data) => {
            queryClient.clear();
            queryClient.setQueryData(['status'], data);
            setUser(data.user);
            toast.add({
                type: 'success',
                title: 'Your first ripple starts here',
                description: `Welcome, ${data.user.first_name}. Your account and first project are ready.`,
            });
            navigate('/today', { replace: true });
        },
    });
    const resend = useMutation({
        mutationFn: resendSignupCode,
        onSuccess: (data) => {
            setChallenge(data);
            setCode('');
            setNow(Date.now());
            verify.reset();
            codeRef.current?.focus();
            toast.add({
                type: 'info',
                title: 'A fresh code is on its way',
                description: 'Only the newest verification code will work.',
            });
        },
    });
    const busy = start.isPending || verify.isPending || resend.isPending;

    useEffect(() => {
        if (verify.isError) codeRef.current?.focus();
    }, [verify.isError]);
    const resendWait = challenge
        ? Math.max(0, Math.ceil((new Date(challenge.resend_available_at).getTime() - now) / 1000))
        : 0;
    const expiresIn = challenge
        ? Math.max(0, Math.ceil((new Date(challenge.expires_at).getTime() - now) / 1000))
        : 0;
    const titles = ['Your first ripple', 'Make it your own', 'One last little step'];

    if (!site.signup_enabled && !challenge)
        return (
            <div className="max-w-sm text-center">
                <h1 className="text-foreground text-2xl font-medium">
                    <AccentTitle>A little pause in new beginnings</AccentTitle>
                </h1>
                <p className="text-muted-foreground mt-4 text-sm leading-7">
                    New registrations are currently paused. Existing users can still sign in.
                </p>
                <Link
                    to="/login"
                    className="text-primary-foreground mt-6 inline-block text-sm underline"
                >
                    Back to sign in
                </Link>
            </div>
        );

    return (
        <form
            noValidate
            aria-labelledby="signup-title"
            className="editor-form w-full max-w-[420px]"
            onSubmit={(event) => {
                event.preventDefault();
                if (busy) return;
                if (step === 2 && challenge) {
                    if (code.length === 6 && expiresIn > 0)
                        verify.mutate({ challenge_id: challenge.challenge_id, code });
                    return;
                }
                clearErrors();
                const parsed = (step === 0 ? signupIdentitySchema : signupSchema).safeParse(
                    getValues()
                );
                if (!parsed.success) return setValidationErrors(parsed.error.issues, setError);
                if (step === 0) setStep(1);
                else start.mutate(signupSchema.parse(getValues()));
            }}
        >
            <div className="text-muted-foreground mb-5 flex items-center gap-2 text-[9px] font-medium tracking-[0.14em]">
                <Waves size={16} className="text-primary" />A NEW CURRENT STARTS HERE
            </div>
            <h1
                id="signup-title"
                ref={headingRef}
                tabIndex={-1}
                className="text-foreground text-[32px] leading-tight font-semibold tracking-[-0.05em] sm:text-[36px]"
            >
                <AccentTitle>{titles[step]}</AccentTitle>
            </h1>
            <p className="text-muted-foreground mt-3 text-[12px] leading-relaxed">
                {step === 0
                    ? 'A few essentials, then a little room to make this space yours.'
                    : step === 1
                      ? 'Choose a name, a rhythm, and something worth moving toward.'
                      : challenge?.delivery === 'development_console'
                        ? 'Your verification code is ready in the development email log.'
                        : 'We sent a little six-digit hello to your inbox.'}
            </p>
            <ol aria-label="Signup progress" className="mt-6 mb-7 grid grid-cols-3 gap-2">
                {['Your details', 'Your rhythm', 'Verify email'].map((label, index) => (
                    <li
                        key={label}
                        aria-current={step === index ? 'step' : undefined}
                        className={cn(
                            'border-input text-muted-foreground flex items-center gap-2 border-b-2 pb-3 text-[9px]',
                            step >= index && 'border-primary text-foreground'
                        )}
                    >
                        <span
                            className={cn(
                                'bg-accent flex size-5 shrink-0 items-center justify-center rounded-md text-[9px]',
                                step >= index && 'bg-primary/20'
                            )}
                        >
                            {index < step ? <Check size={11} /> : index + 1}
                        </span>
                        {label}
                    </li>
                ))}
            </ol>
            {step === 0 && (
                <fieldset disabled={busy} className="grid min-w-0 gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <LabeledInput
                            label="First name"
                            autoComplete="given-name"
                            maxLength={150}
                            error={errors.first_name?.message}
                            {...register('first_name')}
                        />
                        <LabeledInput
                            label="Last name"
                            autoComplete="family-name"
                            maxLength={150}
                            error={errors.last_name?.message}
                            {...register('last_name')}
                        />
                    </div>
                    <LabeledInput
                        label="Email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        maxLength={254}
                        error={errors.email?.message}
                        {...register('email')}
                    />
                    <LabeledInput
                        label="Username"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder="Your own little alias"
                        maxLength={150}
                        error={errors.username?.message}
                        {...register('username')}
                    />
                    <LabeledInput
                        label="Password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        maxLength={128}
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                        Use a unique password, not a common word, just numbers, or your personal
                        details.
                    </p>
                </fieldset>
            )}
            {step === 1 && (
                <fieldset disabled={busy} className="grid min-w-0 gap-5">
                    <LabeledInput
                        label="Your flow name · optional"
                        placeholder="Captain of calm, Dream weaver…"
                        maxLength={60}
                        error={errors.flow_name?.message}
                        {...register('flow_name')}
                    />
                    <fieldset>
                        <legend className="text-foreground mb-3 flex items-center gap-1.5 text-[11px] font-medium">
                            <Sparkles size={13} className="text-secondary" />
                            When do your ideas come alive?
                        </legend>
                        <div className="grid grid-cols-3 gap-2">
                            {(
                                [
                                    { value: 'morning_tide', label: 'Morning tide', icon: Sun },
                                    { value: 'night_current', label: 'Night current', icon: Moon },
                                    { value: 'steady_tide', label: 'Steady tide', icon: Waves },
                                ] as const
                            ).map(({ value, label, icon: Icon }) => (
                                <label key={value} className="cursor-pointer">
                                    <input
                                        type="radio"
                                        value={value}
                                        className="peer sr-only"
                                        {...register('focus_style')}
                                    />
                                    <span className="border-input bg-card text-muted-foreground peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground peer-focus-visible:ring-primary flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center text-[9px] transition-colors peer-focus-visible:ring-2">
                                        <Icon size={18} strokeWidth={1.5} />
                                        {label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <LabeledTextarea
                        label="Your north star · optional"
                        placeholder="What would you love to make happen?"
                        rows={2}
                        maxLength={200}
                        error={errors.north_star?.message}
                        {...register('north_star')}
                    />
                    <LabeledInput
                        label="Your first project"
                        placeholder="A place for your first small steps"
                        maxLength={150}
                        error={errors.workspace_name?.message}
                        {...register('workspace_name')}
                    />
                </fieldset>
            )}
            {step === 2 && challenge && (
                <div className="grid min-w-0 gap-5">
                    <div className="surface-wash border-input flex items-center gap-3 rounded-2xl border p-4">
                        <span className="border-input bg-card text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl border">
                            <Mail size={18} strokeWidth={1.6} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-muted-foreground text-[9px]">Verifying your email</p>
                            <p
                                className="text-foreground mt-1 truncate text-[12px] font-medium"
                                title={challenge.email}
                            >
                                {challenge.email}
                            </p>
                        </div>
                    </div>
                    <label className="block">
                        <span className="text-foreground mb-3 block text-[11px] font-medium">
                            Your six-digit code
                        </span>
                        <span className="relative block">
                            <span aria-hidden="true" className="grid grid-cols-6 gap-2">
                                {Array.from({ length: 6 }, (_, index) => (
                                    <span
                                        key={index}
                                        className={cn(
                                            'border-input bg-card text-foreground flex h-14 items-center justify-center rounded-xl border text-xl font-medium tabular-nums sm:h-16',
                                            index === code.length &&
                                                'border-primary ring-primary/15 ring-2',
                                            code[index] && 'bg-primary/10'
                                        )}
                                    >
                                        {code[index] || (
                                            <span className="bg-input size-1 rounded-full" />
                                        )}
                                    </span>
                                ))}
                            </span>
                            <input
                                ref={codeRef}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                aria-label="Six-digit email verification code"
                                maxLength={6}
                                pattern="[0-9]{6}"
                                value={code}
                                disabled={busy || expiresIn === 0}
                                style={{ color: 'transparent', caretColor: 'transparent' }}
                                className="focus-visible:ring-primary absolute inset-0 h-full w-full cursor-text rounded-xl border-0 bg-transparent outline-none focus-visible:ring-2"
                                onChange={(event) => {
                                    const next = event.target.value
                                        .replace(/[^0-9]/g, '')
                                        .slice(0, 6);
                                    setCode(next);
                                    verify.reset();
                                    if (next.length === 6 && !busy && expiresIn > 0)
                                        verify.mutate({
                                            challenge_id: challenge.challenge_id,
                                            code: next,
                                        });
                                }}
                            />
                        </span>
                    </label>
                    <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-[10px]">
                        <span className="flex items-center gap-1.5">
                            <Clock3 size={12} />
                            {expiresIn
                                ? `Valid for ${Math.floor(expiresIn / 60)}:${String(expiresIn % 60).padStart(2, '0')}`
                                : 'Code expired. Request a fresh one.'}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={busy || resendWait > 0}
                            isPending={resend.isPending}
                            onClick={() => resend.mutate(challenge.challenge_id)}
                            className="h-8 gap-1.5 rounded-lg px-2 text-[10px]"
                        >
                            <RefreshCw size={11} />
                            {resendWait > 0 ? `Resend in ${resendWait}s` : 'Send a new code'}
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-[10px] leading-relaxed">
                        {challenge.delivery === 'development_console'
                            ? 'Development email is printed in the backend logs. Open “docker compose logs backend” and paste the newest code here.'
                            : 'Paste the full code or use email autofill. Not seeing it? Check your spam folder.'}
                    </p>
                    {verify.isError && (
                        <p
                            role="alert"
                            className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border px-3 py-2 text-[11px] leading-relaxed"
                        >
                            Verification failed. Check the newest code or request another. Your
                            account has not been created.
                        </p>
                    )}
                </div>
            )}
            <DisplayError error={start.error || verify.error || resend.error} />
            <div className="mt-6 flex items-center gap-2">
                {step > 0 && (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        aria-label={step === 2 ? 'Change signup details' : 'Previous step'}
                        className="size-11 shrink-0 rounded-xl p-0"
                        onClick={() => {
                            start.reset();
                            verify.reset();
                            resend.reset();
                            setStep(step === 2 ? 0 : step - 1);
                            setChallenge(null);
                            setCode('');
                        }}
                    >
                        <ArrowLeft size={16} />
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={busy || (step === 2 && (code.length !== 6 || expiresIn === 0))}
                    isPending={start.isPending || verify.isPending}
                    className="bg-brand h-11 min-w-0 flex-1 gap-2 rounded-xl text-xs text-white"
                >
                    {step === 0
                        ? 'Find your rhythm'
                        : step === 1
                          ? 'Send my verification code'
                          : 'Verify & step into your space'}
                    {!busy && <ArrowRight size={14} />}
                </Button>
            </div>
            {step === 1 && (
                <p className="text-muted-foreground mt-3 flex items-center justify-center gap-1.5 text-[9px]">
                    <ShieldCheck size={12} />
                    Your account is created only after email verification.
                </p>
            )}
            <p className="text-muted-foreground mt-6 text-center text-[11px]">
                Already have your own little space?{' '}
                <Link
                    to="/login"
                    className="text-foreground decoration-input focus-visible:ring-primary rounded font-medium underline underline-offset-4 focus-visible:ring-2"
                >
                    Sign in
                </Link>
            </p>
        </form>
    );
}
