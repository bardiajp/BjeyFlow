import { useQuery } from '@tanstack/react-query';
import {
    ArrowUpRight,
    CheckCheck,
    CircleAlert,
    FolderOpen,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { Link } from 'react-router';
import { getOverview } from './api';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';
import { AccentTitle } from '@/components/accent-title';
import { formatDay } from '@/lib/date';

export default function AdminOverview() {
    const query = useQuery({ queryKey: ['admin', 'overview'], queryFn: getOverview });
    if (query.isPending) return <Loading />;
    if (query.error)
        return <DisplayError error={query.error} onRetry={() => void query.refetch()} />;
    const data = query.data;
    const cards = [
        {
            label: 'People in your flow',
            count: data.counts.users,
            detail: `${data.counts.active_accounts} active accounts`,
            icon: Users,
        },
        {
            label: 'Signed in this week',
            count: data.counts.signed_in_last_week,
            detail: 'Successful sign-ins in the last 7 days',
            icon: ShieldCheck,
        },
        {
            label: 'Projects',
            count: data.counts.projects,
            detail: 'Aggregate only · private content stays private',
            icon: FolderOpen,
        },
        {
            label: 'Tasks in motion',
            count: data.counts.tasks,
            detail: `${data.counts.trashed_tasks} tasks safely in Trash`,
            icon: ArrowUpRight,
        },
        {
            label: 'Small steps completed',
            count: data.counts.completed_tasks,
            detail: 'Completed tasks outside Trash',
            icon: CheckCheck,
        },
        {
            label: 'Things to look into',
            count: data.counts.errors_last_week + data.counts.email_failures_last_week,
            detail: `${data.counts.errors_last_week} errors · ${data.counts.email_failures_last_week} email failures this week`,
            icon: CircleAlert,
        },
    ];
    const peak = Math.max(1, ...data.registrations.map((day) => day.count));
    return (
        <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                    <article
                        key={card.label}
                        className="border-input bg-card rounded-3xl border p-5"
                    >
                        <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
                            <span>{card.label}</span>
                            <card.icon size={17} strokeWidth={1.5} />
                        </div>
                        <p className="text-foreground mt-5 text-4xl font-medium tracking-tight tabular-nums">
                            {card.count.toLocaleString()}
                        </p>
                        <p className="text-muted-foreground mt-3 text-[11px] leading-6">
                            {card.detail}
                        </p>
                    </article>
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <section className="border-input bg-card rounded-3xl border p-6">
                    <h2 className="text-foreground text-lg font-medium">
                        <AccentTitle>New faces, this week</AccentTitle>
                    </h2>
                    <div className="mt-6 grid gap-4">
                        {data.registrations.length ? (
                            data.registrations.map((day) => (
                                <div
                                    key={day.day}
                                    className="grid grid-cols-[5rem_1fr_2rem] items-center gap-3 text-xs"
                                >
                                    <span className="text-muted-foreground">
                                        {formatDay(day.day)}
                                    </span>
                                    <div className="bg-accent h-2 overflow-hidden rounded-full">
                                        <div
                                            className="bg-primary h-full rounded-full"
                                            style={{ width: `${(day.count / peak) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-foreground text-right tabular-nums">
                                        {day.count}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No new registrations in the last seven days.
                            </p>
                        )}
                    </div>
                </section>
                <section className="border-input bg-card rounded-3xl border p-6">
                    <h2 className="text-foreground text-lg font-medium">
                        <AccentTitle>A little security check-in</AccentTitle>
                    </h2>
                    <p className="text-muted-foreground mt-4 text-sm leading-7">
                        {data.counts.failed_logins_last_week} unsuccessful sign-in attempts in the
                        last seven days. Review the activity trail for unusual patterns.
                    </p>
                    <Link
                        to="/admin/activity"
                        className="text-primary-foreground mt-5 inline-flex items-center gap-2 text-sm"
                    >
                        Review activity <ArrowUpRight size={15} />
                    </Link>
                    <p className="text-muted-foreground mt-5 text-xs leading-6">
                        Counts cover the workspace, not the contents of anyone’s tasks. Activity
                        tracking starts when this feature is deployed.
                    </p>
                </section>
            </div>
        </div>
    );
}
