import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';
import { axiosInstance } from '@/lib/api';
import { formatTimestamp } from '@/lib/date';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';

interface Recommendation {
    id: string;
    title: string;
    description: string;
    username: string | null;
    created_at: string;
}

export default function AdminRecommendations() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const debounced = useDebouncedValue(search);
    const query = useQuery({
        queryKey: ['admin', 'recommendations', page, debounced],
        queryFn: async () =>
            (
                await axiosInstance.get<{
                    count: number;
                    next: string | null;
                    previous: string | null;
                    results: Recommendation[];
                }>('/api/admin/recommendations/', { params: { page, search: debounced } })
            ).data,
    });
    return (
        <section className="bg-card border-input min-w-0 rounded-3xl border p-4 sm:p-6">
            <h1 className="text-foreground flex items-center gap-2 text-lg font-semibold">
                <Lightbulb size={19} /> Feature suggestions
            </h1>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                Ideas from your users to make their everyday workflow easier. Newest suggestions
                appear first.
            </p>
            <div className="my-5 flex gap-3">
                <Input
                    type="search"
                    aria-label="Search suggestions"
                    placeholder="Search suggestions or usernames…"
                    className="max-w-sm rounded-xl"
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    aria-label="Refresh suggestions"
                    disabled={query.isFetching}
                    onClick={() => void query.refetch()}
                >
                    <RefreshCw size={15} />
                </Button>
            </div>
            {query.isPending ? (
                <Loading />
            ) : query.isError ? (
                <DisplayError error={query.error} onRetry={() => void query.refetch()} />
            ) : query.data.results.length ? (
                <>
                    <ul className="divide-border divide-y">
                        {query.data.results.map((item) => (
                            <li key={item.id} className="min-w-0 py-5">
                                <h2 className="text-foreground text-sm font-semibold wrap-anywhere">
                                    {item.title}
                                </h2>
                                <p className="text-foreground mt-2 text-xs leading-6 wrap-anywhere whitespace-pre-wrap">
                                    {item.description}
                                </p>
                                <div className="text-muted-foreground mt-3 flex flex-wrap justify-between gap-2 text-[11px]">
                                    <span>
                                        {item.username ? `@${item.username}` : 'Deleted account'}
                                    </span>
                                    <time dateTime={item.created_at}>
                                        {formatTimestamp(item.created_at)}
                                    </time>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex items-center justify-between gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            aria-label="Previous suggestions"
                            disabled={!query.data.previous}
                            onClick={() => setPage((value) => value - 1)}
                        >
                            <ArrowLeft size={15} />
                        </Button>
                        <span className="text-muted-foreground text-xs">
                            Page {page} · {query.data.count} suggestions
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            aria-label="Next suggestions"
                            disabled={!query.data.next}
                            onClick={() => setPage((value) => value + 1)}
                        >
                            <ArrowRight size={15} />
                        </Button>
                    </div>
                </>
            ) : (
                <p className="text-muted-foreground py-8 text-center text-xs">
                    {search ? 'No suggestions match your search.' : 'No suggestions yet.'}
                </p>
            )}
        </section>
    );
}
