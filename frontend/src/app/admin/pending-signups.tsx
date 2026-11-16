import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck } from 'lucide-react';
import { axiosInstance } from '@/lib/api';
import { InlineConfirm } from '@/components/inline-confirm';
import DisplayError from '@/components/display-error';
import { formatTimestamp } from '@/lib/date';
import useUserStore from '@/store/use-user-store';

interface PendingSignup {
    id: string;
    username: string;
    email: string;
    last_sent_at: string;
    expires_at: string;
}

export function PendingSignups() {
    const user = useUserStore((state) => state.user);
    const client = useQueryClient();
    const pending = useQuery({
        queryKey: ['admin', 'pending-signups'],
        queryFn: async () =>
            (await axiosInstance.get<PendingSignup[]>('api/admin/pending-signups/')).data,
        enabled: user?.role === 'superuser',
    });
    const approve = useMutation({
        mutationFn: async (id: string) =>
            axiosInstance.post(`api/admin/pending-signups/${id}/approve/`),
        onSuccess: async () => {
            await Promise.all([
                client.invalidateQueries({ queryKey: ['admin', 'pending-signups'] }),
                client.invalidateQueries({ queryKey: ['users'] }),
            ]);
        },
    });
    if (user?.role !== 'superuser') return null;
    return (
        <section className="border-input bg-card mb-5 rounded-2xl border p-4 sm:p-5">
            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <UserCheck size={16} /> Pending signups
            </h2>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                If email is delayed, independently verify the person's identity before approving.
                Approval creates their account without email verification and is recorded. Requests
                remain available for 24 hours; no verification code is exposed.
            </p>
            <DisplayError error={pending.error} />
            {pending.isPending && (
                <p className="text-muted-foreground mt-4 text-xs">Loading requests…</p>
            )}
            {pending.data?.length === 0 && (
                <p className="text-muted-foreground mt-4 text-xs">No recent pending signups.</p>
            )}
            {pending.data?.map((item) => (
                <div
                    key={item.id}
                    className="border-input mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                >
                    <div className="min-w-0">
                        <p className="text-foreground text-xs font-medium break-all">
                            {item.username} · {item.email}
                        </p>
                        <p className="text-muted-foreground mt-1 text-[10px]">
                            Requested {formatTimestamp(item.last_sent_at)} · code expires{' '}
                            {formatTimestamp(item.expires_at)}
                        </p>
                    </div>
                    <InlineConfirm
                        label={`Approve signup for ${item.username}`}
                        title="Verify identity first"
                        description="This creates an account without verifying its email. Confirm the user's identity independently first."
                        confirmLabel="Approve signup"
                        tone="normal"
                        disabled={approve.isPending}
                        onConfirm={() => approve.mutateAsync(item.id)}
                    >
                        Approve signup
                    </InlineConfirm>
                </div>
            ))}
        </section>
    );
}
