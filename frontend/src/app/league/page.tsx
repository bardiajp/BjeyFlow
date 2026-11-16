import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/api';
import PageLayout from '@/layouts/page';
import {
    ArrowUpRight,
    CircleHelp,
    Clock3,
    LockKeyhole,
    Medal,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';
import { Popover } from '@base-ui/react/popover';
import { Button } from '@/components/ui/button';
import { LabeledInput } from '@/components/form/labeled';

interface League {
    joined: boolean;
    public_name?: string;
    tier?: string;
    starts_at?: string;
    ends_at?: string;
    standings?: { rank: number; name: string; score: number; level: number; is_me: boolean }[];
    previous?: { tier: string; rank: number; score: number; outcome: string } | null;
}

export default function LeaguePage() {
    const client = useQueryClient();
    const [name, setName] = useState('');
    const league = useQuery({
        queryKey: ['league'],
        queryFn: async () => (await axiosInstance.get<League>('api/league/')).data,
        refetchInterval: 30000,
    });
    const mutation = useMutation({
        mutationFn: async (join: boolean) =>
            join
                ? axiosInstance.post('api/league/', { public_name: name })
                : axiosInstance.delete('api/league/'),
        onSuccess: async () => {
            await client.invalidateQueries({ queryKey: ['league'] });
        },
    });
    function join(event: FormEvent) {
        event.preventDefault();
        mutation.mutate(true);
    }
    const me = league.data?.standings?.find((row) => row.is_me);
    const tiers = ['Spark', 'Rise', 'Flow', 'Momentum', 'Orbit'];
    return (
        <PageLayout title="Weekly league">
            <section className="surface-hero border-primary/20 relative overflow-hidden rounded-[24px] border p-5 sm:p-7">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-16 -right-12 size-56 rounded-full border-[30px] border-white/30"
                />
                <div className="relative">
                    <div className="pt-20 sm:pt-0 sm:pr-24">
                        <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-slate-400">
                            <Sparkles size={14} className="text-secondary" /> A LITTLE FRIENDLY
                            MOMENTUM
                        </div>
                        <h2 className="text-primary-foreground text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                            Show up. Move forward<span className="text-secondary">.</span>
                        </h2>
                        <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
                            Small steps count. Find your rhythm alongside others, one week at a
                            time.
                        </p>
                    </div>
                    <span className="absolute top-0 right-0 flex size-16 items-center justify-center rounded-[22px] border border-white bg-white/70 text-[#e9a234] shadow-sm">
                        <Trophy size={30} strokeWidth={1.5} />
                    </span>
                </div>
                <div className="relative mt-6 flex flex-wrap gap-2">
                    {tiers.map((tier, index) => (
                        <span
                            key={tier}
                            className={`rounded-xl border px-3 py-2 text-xs ${league.data?.tier === tier ? 'text-primary-foreground border-[#8ecae6] bg-white font-semibold' : 'border-white bg-white/60 text-slate-400'}`}
                        >
                            <span className="mr-1.5 text-[#e5a440]">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            {tier}
                        </span>
                    ))}
                </div>
            </section>
            <div className="flex items-center gap-2 text-sm text-slate-500">
                How scoring works
                <Popover.Root>
                    <Popover.Trigger
                        openOnHover
                        delay={150}
                        closeDelay={180}
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="How league scoring works"
                                className="text-primary-foreground rounded-lg"
                            />
                        }
                    >
                        <CircleHelp size={16} />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Positioner
                            side="bottom"
                            align="start"
                            sideOffset={8}
                            collisionPadding={16}
                            className="z-[60]"
                        >
                            <Popover.Popup className="flow-popover text-foreground w-72 max-w-[calc(100vw-2rem)] p-4 text-xs leading-relaxed outline-none">
                                <Popover.Title className="mb-2 font-semibold">
                                    League scoring
                                </Popover.Title>
                                <p className="text-muted-foreground">
                                    Complete tasks for XP: Low 5, Normal 10, High 15, Urgent 20. Up
                                    to 100 XP counts each UTC day. Reopened tasks don't count while
                                    open.
                                </p>
                            </Popover.Popup>
                        </Popover.Positioner>
                    </Popover.Portal>
                </Popover.Root>
            </div>
            {(league.isError || mutation.isError) && (
                <p role="alert" className="text-sm text-red-600">
                    Could not update the league. Please try again.
                </p>
            )}
            {league.isLoading && <p className="text-sm text-slate-500">Loading league…</p>}
            {league.data && !league.data.joined && (
                <form
                    onSubmit={join}
                    className="grid gap-5 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_-16px_#02304720] sm:p-6"
                >
                    <div className="flex items-start gap-3">
                        <span className="bg-primary/10 text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                            <Medal size={19} />
                        </span>
                        <div>
                            <h2 className="text-primary-foreground font-semibold">
                                Your place in the league
                            </h2>
                            <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                Join when you’re ready. Your score starts counting from the moment
                                you join.
                            </p>
                        </div>
                    </div>
                    <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                        <LockKeyhole size={15} className="shrink-0 text-[#3889a1]" /> Only your
                        public name, level, weekly score and rank are shared. Goals, tasks and notes
                        stay private.
                    </p>
                    <LabeledInput
                        label="Public name"
                        placeholder="How should others see you?"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={50}
                        required
                    />
                    <Button
                        type="submit"
                        disabled={mutation.isPending || !name.trim()}
                        isPending={mutation.isPending}
                        className="w-fit gap-2 rounded-xl"
                    >
                        Join league
                        <ArrowUpRight size={15} />
                    </Button>
                </form>
            )}
            {league.data?.joined && (
                <section className="grid gap-5 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_-16px_#02304720] sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.14em] text-slate-400">
                                <Trophy size={13} /> THIS WEEK
                            </div>
                            <h2 className="text-primary-foreground text-xl font-semibold tracking-tight">
                                {league.data.tier} league
                            </h2>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                <Clock3 size={13} />
                                Ends{' '}
                                {league.data.ends_at &&
                                    new Date(league.data.ends_at).toLocaleString()}{' '}
                                · displayed in your local time
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate(false)}
                            className="rounded-xl"
                        >
                            Leave league
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="bg-primary/10 rounded-2xl p-4">
                            <p className="text-xs text-slate-400">Your rank</p>
                            <p className="text-primary-foreground mt-1 text-xl font-semibold tabular-nums">
                                {me ? `#${me.rank}` : '—'}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-orange-50 p-4">
                            <p className="text-xs text-slate-400">Weekly XP</p>
                            <p className="text-primary-foreground mt-1 text-xl font-semibold tabular-nums">
                                {me?.score ?? 0}
                            </p>
                        </div>
                        <div className="col-span-2 rounded-2xl bg-slate-50 p-4 sm:col-span-1">
                            <p className="text-xs text-slate-400">In your group</p>
                            <p className="text-primary-foreground mt-1 flex items-center gap-1.5 text-xl font-semibold tabular-nums">
                                <Users size={17} className="text-[#8ab4c1]" />
                                {league.data.standings?.length ?? 0}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <h3 className="text-primary-foreground font-semibold">Leaderboard</h3>
                            <p className="mt-1 text-xs text-slate-400">Your group, this week.</p>
                        </div>
                        <span className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-400">
                            LIVE
                        </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">
                        Up to 100 XP per UTC day. Active groups of at least 5 can promote; demotion
                        requires at least 10 active members. Inactive members do not move.
                    </p>
                    <div className="grid gap-2">
                        {league.data.standings?.map((row) => (
                            <div
                                key={row.rank}
                                className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${row.is_me ? 'border-primary/40 bg-primary/10 text-foreground font-semibold' : 'text-foreground border-slate-100 bg-slate-50/60'}`}
                            >
                                <span className="flex min-w-0 items-center gap-3">
                                    <span
                                        className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${row.rank <= 3 ? 'bg-orange-100 text-orange-700' : 'bg-white text-slate-400'}`}
                                    >
                                        {row.rank}
                                    </span>
                                    <span className="truncate">
                                        {row.name}
                                        {row.is_me ? ' (you)' : ''}
                                    </span>
                                    <span className="bg-primary/15 text-primary-foreground shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold tabular-nums">
                                        LVL {row.level}
                                    </span>
                                </span>
                                <span className="text-primary-foreground shrink-0 tabular-nums">
                                    {row.score} <span className="text-xs text-slate-400">XP</span>
                                </span>
                            </div>
                        ))}
                    </div>
                    {league.data.previous && (
                        <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
                            Last week: {league.data.previous.tier} · #{league.data.previous.rank} ·{' '}
                            {league.data.previous.score} XP · {league.data.previous.outcome}
                        </p>
                    )}
                </section>
            )}
        </PageLayout>
    );
}
