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

export default function AdminEvents({ kind }: { kind: 'activity' | 'emails' | 'errors' }) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const debounced = useDebouncedValue(search);
    const query = useQuery({
        queryKey: ['admin', kind, page, debounced],
        queryFn: () => getAdminEvents(kind, page, debounced),
    });
    const copy =
        kind === 'activity'
            ? 'An accountable trail of sign-ins and administrator actions. Passwords and reset tokens are never recorded.'
            : kind === 'emails'
              ? 'Accepted means the configured email backend accepted the message, not that it reached an inbox. Development messages are printed to the console.'
              : 'Server-side error categories, without raw traces, request bodies, or secrets. Use restricted server logs for full diagnostics.';
    return (
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
                <Button
                    variant="outline"
                    className="rounded-xl"
                    aria-label="Refresh events"
                    isPending={query.isRefetching}
                    onClick={() => void query.refetch()}
                >
                    <RefreshCw size={15} />
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
                            className="flex flex-wrap items-start justify-between gap-3 py-4"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-foreground text-sm font-medium wrap-break-word">
                                    {kind === 'activity'
                                        ? event.action?.replaceAll('.', ' · ').replaceAll('_', ' ')
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
                                    <p
                                        className={cn(
                                            'mt-1 text-[11px]',
                                            event.status === 'failed'
                                                ? 'text-destructive'
                                                : 'text-muted-foreground'
                                        )}
                                    >
                                        {event.status === 'failed'
                                            ? `Failed · ${event.error_type || 'Backend returned no acceptance'}`
                                            : 'Accepted by backend'}{' '}
                                        · {event.backend?.split('.').slice(-2, -1)[0]}
                                    </p>
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
    );
}
