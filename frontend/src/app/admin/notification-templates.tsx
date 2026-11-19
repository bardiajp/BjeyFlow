import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellRing, RefreshCw, Smartphone } from 'lucide-react';
import { axiosInstance } from '@/lib/api';
import { AccentTitle } from '@/components/accent-title';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationArtCard } from '@/components/notification-art-card';

interface NotificationTemplate {
    id: string;
    name: string;
    description: string;
    title: string;
    body: string;
    image?: string;
}

export default function AdminNotificationTemplates() {
    const query = useQuery({
        queryKey: ['admin', 'notification-templates'],
        queryFn: async () =>
            (await axiosInstance.get<NotificationTemplate[]>('/api/admin/notification-templates/'))
                .data,
        refetchOnMount: 'always',
    });
    const [selected, setSelected] = useState('task_reminder');
    if (query.isPending) return <Loading />;
    if (query.isLoadingError)
        return <DisplayError error={query.error} onRetry={() => void query.refetch()} />;
    const template = query.data.find((item) => item.id === selected)!;
    return (
        <section className="bg-card border-input flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-3xl border">
            <header className="border-input flex flex-wrap items-center justify-between gap-4 border-b px-5 py-6 sm:px-6">
                <div>
                    <h1 className="text-foreground text-xl font-semibold tracking-tight">
                        <AccentTitle>A gentle nudge</AccentTitle>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-xs leading-6">
                        Read-only previews of the notification messages used by BjeyFlow. No
                        notification is sent.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-accent text-muted-foreground rounded-full px-3 py-2 text-[10px]">
                        Read-only preview
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 gap-2 rounded-xl text-xs"
                        disabled={query.isFetching}
                        onClick={() => void query.refetch()}
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        {query.isFetching ? 'Refreshing…' : 'Refresh previews'}
                    </Button>
                </div>
            </header>
            <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)]">
                <nav
                    aria-label="Notification template selection"
                    className="border-input grid content-start gap-2 border-b p-4 lg:border-r lg:border-b-0"
                >
                    {query.data.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            aria-pressed={selected === item.id}
                            onClick={() => setSelected(item.id)}
                            className={cn(
                                'flow-control flex items-start gap-3 rounded-2xl border p-4 text-left outline-none focus-visible:ring-2',
                                selected === item.id
                                    ? 'border-primary/30 bg-primary/10'
                                    : 'hover:bg-accent border-transparent'
                            )}
                        >
                            <BellRing
                                size={18}
                                className="text-primary-foreground mt-0.5 shrink-0"
                            />
                            <span>
                                <span className="text-foreground block text-xs font-medium">
                                    {item.name}
                                </span>
                                <span className="text-muted-foreground mt-1.5 block text-[10px] leading-5">
                                    {item.description}
                                </span>
                            </span>
                        </button>
                    ))}
                </nav>
                <div className="bg-workspace min-w-0 p-4 sm:p-8">
                    <div className="text-muted-foreground mb-4 flex items-center gap-2 text-xs">
                        <Smartphone size={16} />
                        Illustrative device preview
                    </div>
                    {query.isRefetchError && (
                        <div className="mb-4">
                            <DisplayError error={query.error} onRetry={() => void query.refetch()} />
                        </div>
                    )}
                    {template.image && (
                        <div className="mx-auto mb-6 max-w-3xl">
                            <h2 className="text-muted-foreground mb-2 text-xs font-medium">
                                In-app notification · light and dark
                            </h2>
                            <div className="grid gap-4 xl:grid-cols-2">
                                {(['light', 'dark'] as const).map((theme) => (
                                    <NotificationArtCard
                                        key={theme}
                                        title={template.title}
                                        body={template.body}
                                        image={template.image!}
                                        theme={theme}
                                        className="min-h-40"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mx-auto grid max-w-3xl gap-4 xl:grid-cols-2">
                        {(
                            [
                                {
                                    label: 'Light mode',
                                    card: 'border-[#d9e5eb] bg-[#f8fbfd] text-[#183746]',
                                    secondary: 'text-[#506976]',
                                },
                                {
                                    label: 'Dark mode',
                                    card: 'border-[#45606c] bg-[#263f4d] text-[#f2f8fb]',
                                    secondary: 'text-[#c6d9e2]',
                                },
                            ] as const
                        ).map((mode) => (
                            <section
                                key={mode.label}
                                aria-label={`${mode.label} notification preview`}
                            >
                                <h2 className="text-muted-foreground mb-2 text-xs font-medium">
                                    {mode.label}
                                </h2>
                                <div
                                    className={cn(
                                        'min-h-32 rounded-[22px] border p-4 shadow-lg',
                                        mode.card
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'mb-3 flex items-center gap-2 text-xs',
                                            mode.secondary
                                        )}
                                    >
                                        <img
                                            src="/icons/notification.png"
                                            alt=""
                                            className="size-6 rounded-md"
                                        />
                                        BjeyFlow<span className="ml-auto">now</span>
                                    </div>
                                    <p className="text-sm font-semibold">{template.title}</p>
                                    <p className={cn('mt-1 text-xs leading-6', mode.secondary)}>
                                        {template.body}
                                    </p>
                                    {template.image && (
                                        <img
                                            src={template.image}
                                            alt={`${template.name} illustration`}
                                            className="mt-3 aspect-[75/32] w-full rounded-xl object-cover"
                                        />
                                    )}
                                </div>
                            </section>
                        ))}
                    </div>
                    <p className="text-muted-foreground mx-auto mt-5 max-w-3xl text-xs leading-6">
                        The full-background card is shown inside BjeyFlow. System notifications
                        use the device's layout and may not show the image. Task titles are hidden
                        to protect lock-screen privacy.
                    </p>
                </div>
            </div>
        </section>
    );
}
