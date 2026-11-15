import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Shield } from 'lucide-react';
import { getSessions, revokeSession } from './api';
import { InlineConfirm } from '@/components/inline-confirm';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';
import { formatTimestamp } from '@/lib/date';
import { toast } from '@/components/ui/toast';

export function SessionSettings() {
    const client = useQueryClient();
    const query = useQuery({
        queryKey: ['account-sessions'],
        queryFn: getSessions,
        refetchInterval: 60_000,
    });
    const mutation = useMutation({
        mutationFn: revokeSession,
        onSuccess: async () => {
            await client.invalidateQueries({ queryKey: ['account-sessions'] });
            toast.add({ type: 'success', title: 'Session signed out' });
        },
    });
    return (
        <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                    <Shield size={16} />
                    Active sessions
                </h2>
                {query.data?.some((session) => !session.current) && (
                    <InlineConfirm
                        label="Sign out other devices"
                        title="Sign out other devices?"
                        description="Other active sessions will lose access on their next request. This device stays signed in."
                        confirmLabel="Sign out others"
                        disabled={mutation.isPending}
                        onConfirm={() => mutation.mutateAsync(undefined)}
                    >
                        Sign out others
                    </InlineConfirm>
                )}
            </div>
            <p className="text-muted-foreground mt-2 mb-4 text-[11px]">
                Only your account’s active sessions are shown. Changing your password signs out
                every session.
            </p>
            {query.isPending && (
                <div className="flex justify-center py-5">
                    <Loading />
                </div>
            )}
            <DisplayError error={query.error} onRetry={() => void query.refetch()} />
            <div className="divide-input divide-y">
                {query.data?.map((session) => (
                    <div key={session.id} className="flex flex-wrap items-center gap-3 py-4">
                        <Monitor size={18} className="text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1 basis-48">
                            <p className="text-foreground text-xs font-medium">
                                {session.current ? 'This device' : 'Other device'}
                            </p>
                            <p
                                className="text-muted-foreground mt-1 truncate text-[10px]"
                                title={session.user_agent}
                            >
                                {session.user_agent || 'Unknown browser'} ·{' '}
                                {session.ip_address || 'IP unavailable'}
                            </p>
                            <p className="text-muted-foreground mt-1 text-[10px]">
                                Last active {formatTimestamp(session.last_seen)}
                            </p>
                        </div>
                        {session.current ? (
                            <span className="bg-accent text-muted-foreground rounded-lg px-3 py-2 text-[10px]">
                                Current session
                            </span>
                        ) : (
                            <InlineConfirm
                                label="Sign out device"
                                title="Sign out this device?"
                                description="This session will lose access on its next request."
                                confirmLabel="Sign out"
                                disabled={mutation.isPending}
                                onConfirm={() => mutation.mutateAsync(session.id)}
                            >
                                Sign out
                            </InlineConfirm>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
