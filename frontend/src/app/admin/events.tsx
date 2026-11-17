import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { getAdminEvents } from './api';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatTimestamp } from '@/lib/date';
import { PendingSignups } from './pending-signups';
import { Badge } from '@/components/ui/badge';
import { LabeledSelect } from '@/components/form/labeled-select';
import { useRefresh } from '@/hooks/use-refresh';

export default function AdminEvents({ kind }: { kind: 'activity' | 'emails' | 'errors' }) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('all');
    const debounced = useDebouncedValue(search);
    const query = useQuery({
        queryKey: ['admin', kind, page, debounced, status],
        queryFn: () => getAdminEvents(kind, page, debounced, status === 'all' ? '' : status),
    });
    const refresh = useRefresh(async () => {
        await query.refetch({ throwOnError: true });
    }, 'Events refreshed');
    const copy =
        kind === 'activity'
            ? 'An accountable trail of sign-ins and administrator actions. Passwords and reset tokens are never recorded.'
            : kind === 'emails'
              ? 'Accepted means the configured email backend accepted the message, not that it reached an inbox. Development messages are printed to the console.'
              : 'Server-side error categories, without raw traces, request bodies, or secrets. Use restricted server logs for full diagnostics.';
    return (
        <div className="w-full min-w-0">
            {kind === 'emails' && <PendingSignups />}
            <section className="bg-card border-input rounded-3xl border p-4 sm:p-6">
                <p className="text-muted-foreground mb-5 text-xs leading-6">{copy}</p>
                <div className="mb-5 flex gap-3">
                    <Input
                        type="search"
                        aria-label="Search administration events"
                        placeholder="Search events…"
                        className="max-w-sm rounded-xl"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                    />
                    {kind === 'emails' && (
                        <LabeledSelect
                            label="Delivery status"
                            value={status}
                            onValueChange={(value) => {
                                setStatus(value);
                                setPage(1);
                            }}
                            options={[
                                { value: 'all', label: 'All statuses' },
                                { value: 'failed', label: 'Failed' },
                                { value: 'accepted', label: 'Accepted' },
                            ]}
                            containerClassName="w-44 pt-0"
                        />
                    )}
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        aria-label="Refresh events"
                        disabled={query.isRefetching || refresh.refreshing}
                        aria-busy={refresh.refreshing}
                        onClick={() => void refresh.refresh()}
                    >
                        <RefreshCw size={15} className={cn(refresh.refreshing && 'animate-spin motion-reduce:animate-none')} />
                    </Button>
                </div>
                {query.isPending ? (
                    <Loading />
                ) : query.error ? (
                    <DisplayError error={query.error} onRetry={() => void query.refetch()} />
                ) : query.data.results.length ? (
                    <ul className="divide-border divide-y">
                        {query.data.results.map((event) => (
                            <li
                                key={event.id}
                                className={cn(
                                    'flex flex-wrap items-start justify-between gap-3 py-4',
                                    kind === 'emails' &&
                                        'bg-accent/30 border-input my-2 rounded-2xl border px-4'
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-foreground text-sm font-medium wrap-break-word">
                                        {kind === 'activity'
                                            ? event.action
                                                  ?.replaceAll('.', ' · ')
                                                  .replaceAll('_', ' ')
                                            : kind === 'emails'
                                              ? event.kind?.replaceAll('_', ' ')
                                              : event.error_type}
                                    </p>
                                    <p className="text-muted-foreground mt-2 text-xs leading-6 wrap-break-word">
                                        {kind === 'activity'
                                            ? `${event.actor_name || 'Unauthenticated / system'}${event.target ? ` → ${event.target}` : ''}`
                                            : kind === 'emails'
                                              ? event.recipient
                                              : event.source}
                                    </p>
                                    {kind === 'activity' && event.ip_address && (
                                        <p className="text-muted-foreground mt-1 font-mono text-[10px]">
                                            {event.ip_address}
                                        </p>
                                    )}
                                    {kind === 'emails' && (
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                                            <Badge
                                                variant={
                                                    event.status === 'failed'
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                            >
                                                {event.status === 'failed'
                                                    ? 'Failed to submit'
                                                    : 'Accepted by mail backend'}
                                            </Badge>
                                            <span className="text-muted-foreground">
                                                Backend: {event.backend || 'Unknown'}
                                            </span>
                                            {event.status === 'failed' && (
                                                <span className="text-destructive">
                                                    Error:{' '}
                                                    {event.error_type ||
                                                        'Backend returned no acceptance'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {kind === 'activity' &&
                                        event.metadata &&
                                        Object.keys(event.metadata).length > 0 && (
                                            <p className="text-muted-foreground mt-1 text-[10px] leading-6 wrap-break-word">
                                                {Object.entries(event.metadata)
                                                    .map(
                                                        ([key, value]) =>
                                                            `${key.replaceAll('_', ' ')}: ${Array.isArray(value) ? value.join(', ') : String(value)}`
                                                    )
                                                    .join(' · ')}
                                            </p>
                                        )}
                                </div>
                                <time
                                    className="text-muted-foreground text-[10px] leading-6"
                                    dateTime={event.created_at}
                                >
                                    {formatTimestamp(event.created_at)}
                                </time>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground py-12 text-center text-sm">
                        No events to show yet.
                    </p>
                )}
                {query.data && (
                    <footer className="border-input mt-5 flex items-center justify-between gap-3 border-t pt-4">
                        <p className="text-muted-foreground text-xs">
                            {query.data.count.toLocaleString()} events · page {page}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                aria-label="Previous page"
                                disabled={!query.data.previous || query.isFetching}
                                onClick={() => setPage(page - 1)}
                            >
                                <ArrowLeft size={14} />
                            </Button>
                            <Button
                                variant="outline"
                                aria-label="Next page"
                                disabled={!query.data.next || query.isFetching}
                                onClick={() => setPage(page + 1)}
                            >
                                <ArrowRight size={14} />
                            </Button>
                        </div>
                    </footer>
                )}
            </section>
        </div>
    );
}
