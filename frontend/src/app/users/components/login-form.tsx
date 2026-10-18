import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { login } from '../api/login';
import { loginSchema, type LoginFormValues } from '../schema';
import DisplayError from '@/components/display-error';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useUserStore from '@/store/use-user-store';

export default function LoginForm() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const setUser = useUserStore((state) => state.setUser);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>();
    const mutation = useMutation({
        mutationFn: (values: LoginFormValues) => login(loginSchema.parse(values)),
        onSuccess: (data) => {
            queryClient.clear();
            queryClient.setQueryData(['status'], data);
            setUser(data.user);
            navigate('/');
        },
    });
    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Welcome to BjeyFlow</CardTitle>
                <CardDescription>Sign in to your account to continue.</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    className="grid gap-5"
                    onSubmit={handleSubmit((values) => mutation.mutate(values))}
                >
                    <LabeledInput
                        label="Username"
                        autoComplete="username"
                        {...register('username', { required: true })}
                        isInvalid={!!errors.username}
                        required
                    />
                    <LabeledInput
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        {...register('password', { required: true })}
                        isInvalid={!!errors.password}
                        required
                    />
                    <DisplayError error={mutation.error} />
                    <Button type="submit" isPending={mutation.isPending}>
                        Sign in
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
