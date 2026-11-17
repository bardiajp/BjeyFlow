import { useQuery } from '@tanstack/react-query';
import { Database, HardDrive, Mail, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { getServiceStatus } from './api';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRefresh } from '@/hooks/use-refresh';
import { formatTimestamp } from '@/lib/date';

const statusLabel: Record<string, string> = {
    healthy: 'Healthy',
    unavailable: 'Needs attention',
    development: 'Development console',
    local_memory: 'Local memory · not shared',
    custom_backend: 'Custom email backend',
};
const bytes = (value: number) => `${(value / 1024 ** 3).toFixed(1)} GB`;

export default function AdminServices() {
    const query = useQuery({
        queryKey: ['admin', 'health'],
        queryFn: getServiceStatus,
        staleTime: 60_000,
    });
    const check = useRefresh(async () => {
        const result = await query.refetch({ throwOnError: true });
        if (!result.data) throw new Error('No service status returned.');
        const needsAttention = [
            result.data.database,
            result.data.cache,
            result.data.email,
        ].includes('unavailable');
        return {
            type: needsAttention ? 'warning' : 'success',
            title: needsAttention ? 'Checks complete · attention needed' : 'Checks complete',
            description: needsAttention
                ? 'One or more services need attention. Review the status below.'
                : 'The latest service status is ready.',
        };
    });
    if (query.isPending) return <Loading />;
    if (query.error && !query.data)
        return <DisplayError error={query.error} onRetry={() => void query.refetch()} />;
    const data = query.data;
    const services = [
        { label: 'Database', value: data.database, icon: Database },
        { label: 'Shared cache', value: data.cache, icon: Server },
        { label: 'Email connection', value: data.email, icon: Mail },
    ];
    const used = Math.round((data.disk.used_bytes / data.disk.total_bytes) * 100);
    return (
        <div className="flex w-full flex-1 flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-muted-foreground text-xs leading-6">
                    Live checks do not send email. SMTP availability does not prove inbox delivery.
                </p>
                <Button
                    variant="outline"
                    className="h-10 w-36 shrink-0 gap-2 rounded-xl px-3 text-xs"
                    disabled={check.refreshing || query.isFetching}
                    aria-busy={check.refreshing}
                    onClick={() => void check.refresh()}
                >
                    <RefreshCw
                        size={14}
                        className={cn(
                            'shrink-0',
                            check.refreshing && 'animate-spin motion-reduce:animate-none'
                        )}
                        aria-hidden="true"
                    />{' '}
                    Check again
                </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                {services.map((service) => (
                    <article
                        key={service.label}
                        className="bg-card border-input rounded-3xl border p-5"
                    >
                        <service.icon
                            className="text-primary-foreground mb-5"
                            size={22}
                            strokeWidth={1.5}
                        />
                        <h2 className="text-foreground text-sm font-medium">{service.label}</h2>
                        <p
                            className={cn(
                                'mt-3 text-xs leading-6',
                                service.value === 'healthy'
                                    ? 'text-emerald-600'
                                    : service.value === 'unavailable'
                                      ? 'text-destructive'
                                      : 'text-muted-foreground'
                            )}
                        >
                            {statusLabel[service.value]}
                        </p>
                    </article>
                ))}
            </div>
            <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <section className="bg-card border-input rounded-3xl border p-6">
                    <h2 className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <HardDrive size={17} /> Server storage
                    </h2>
                    <p className="text-foreground mt-5 text-3xl tabular-nums">
                        {used}% <span className="text-muted-foreground text-xs">used</span>
                    </p>
                    <div className="bg-accent mt-4 h-2 rounded-full">
                        <div
                            className={cn(
                                'h-full rounded-full',
                                used >= 85 ? 'bg-destructive' : 'bg-primary'
                            )}
                            style={{ width: `${used}%` }}
                        />
                    </div>
                    <p className="text-muted-foreground mt-4 text-xs">
                        {bytes(data.disk.free_bytes)} free of {bytes(data.disk.total_bytes)} ·
                        filesystem visible to the backend
                    </p>
                </section>
                <section className="bg-card border-input rounded-3xl border p-6">
                    <h2 className="text-foreground flex items-center gap-2 text-sm font-medium">
                        <ShieldCheck size={17} /> Latest database backup
                    </h2>
                    {data.last_backup ? (
                        <>
                            <p className="text-foreground mt-5 text-lg">
                                {formatTimestamp(data.last_backup.created_at)}
                            </p>
                            <p className="text-muted-foreground mt-3 text-xs">
                                {(data.last_backup.size_bytes / 1024 ** 2).toFixed(2)} MB · local
                                database dump
                            </p>
                        </>
                    ) : (
                        <p className="text-muted-foreground mt-5 text-sm leading-7">
                            No backup status has been published. Run the production backup script to
                            publish the latest result.
                        </p>
                    )}
                    <p className="text-muted-foreground mt-4 text-xs leading-6">
                        Local backup metadata does not verify off-server storage or restoration.
                        Backup files cannot be downloaded from this panel.
                    </p>
                </section>
            </div>
        </div>
    );
}
