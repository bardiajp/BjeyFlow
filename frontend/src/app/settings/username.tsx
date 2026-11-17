import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DisplayError from '@/components/display-error';
import { formatTimestamp } from '@/lib/date';
import useUserStore from '@/store/use-user-store';
import { updateUsername } from './api';

export function UsernameSettings() {
    const user = useUserStore((state) => state.user)!;
    const [username, setUsername] = useState(user.username);
    const client = useQueryClient();
    const mutation = useMutation({
        mutationFn: updateUsername,
        onSuccess: (data) => {
            useUserStore.getState().setUser(data.user);
            client.setQueryData(['status'], data);
            setUsername(data.user.username);
        },
    });
    return (
        <section>
            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <AtSign size={16} /> Username
            </h2>
            <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
                You can change your username once every 7 days. Use your new username the next time
                you sign in.
            </p>
            {user.username_change_available_at &&
                new Date(user.username_change_available_at).getTime() > Date.now() && (
                    <p className="text-muted-foreground mt-2 text-[11px]">
                        Next change available {formatTimestamp(user.username_change_available_at)}.
                    </p>
                )}
            <form
                className="mt-3 flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-end"
                onSubmit={(event) => {
                    event.preventDefault();
                    mutation.mutate(username);
                }}
            >
                <label className="min-w-0 w-full flex-1 text-xs">
                    <span className="sr-only">Username</span>
                    <Input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        minLength={3}
                        maxLength={150}
                        required
                        autoComplete="username"
                    />
                </label>
                <Button
                    type="submit"
                    disabled={username === user.username || mutation.isPending}
                    isPending={mutation.isPending}
                    className="w-full rounded-xl text-xs sm:w-auto"
                >
                    Save username
                </Button>
            </form>
            <DisplayError error={mutation.error} />
            {mutation.isSuccess && (
                <p role="status" className="text-muted-foreground mt-2 text-[11px]">
                    Username updated.
                </p>
            )}
        </section>
    );
}
