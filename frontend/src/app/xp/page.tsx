import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/api';
import PageLayout from '@/layouts/page';

interface XPHistory {
    id: string;
    delta: number;
    created_at: string;
    priority: string;
    task: string | null;
}

export default function XPPage() {
    const xp = useQuery({
        queryKey: ['xp'],
        queryFn: async () =>
            (
                await axiosInstance.get<{
                    total_xp: number;
                    today_xp: number;
                    today_league_eligible_xp: number;
                    daily_league_cap: number;
                    history: XPHistory[];
                }>('api/xp/')
            ).data,
    });
    return (
        <PageLayout title="XP history">
            <p className="text-sm text-slate-500">
                Your personal XP reflects completed tasks. League XP counts eligible activity after
                you join.
            </p>
            {xp.isError && (
                <p role="alert" className="text-sm text-red-600">
                    Unable to load XP history.
                </p>
            )}
            {xp.isLoading && <p className="text-sm text-slate-500">Loading…</p>}
            {xp.data && (
                <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-primary-foreground font-semibold">
                        {xp.data.total_xp} personal XP
                    </p>
                    <p className="text-sm text-slate-500">
                        Today's eligible amount: {xp.data.today_league_eligible_xp} /{' '}
                        {xp.data.daily_league_cap} XP (UTC)
                    </p>
                    <h2 className="text-primary-foreground mt-3 font-semibold">Recent changes</h2>
                    {!xp.data.history.length && (
                        <p className="text-sm text-slate-500">
                            Complete a task to earn your first XP.
                        </p>
                    )}
                    {xp.data.history.map((event) => (
                        <div
                            key={event.id}
                            className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-sm"
                        >
                            <div>
                                <p>{event.task ?? 'Deleted task'}</p>
                                <p className="text-xs text-slate-500">
                                    {event.priority} · {new Date(event.created_at).toLocaleString()}
                                </p>
                            </div>
                            <strong
                                className={event.delta > 0 ? 'text-emerald-600' : 'text-slate-500'}
                            >
                                {event.delta > 0 ? '+' : ''}
                                {event.delta} XP
                            </strong>
                        </div>
                    ))}
                </section>
            )}
        </PageLayout>
    );
}
