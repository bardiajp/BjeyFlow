import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Construction, Megaphone } from 'lucide-react';
import { getPublicSettings } from '@/app/admin/api';
import DisplayError from '@/components/display-error';
import AppLoading from '@/components/app-loading';
import { SiteSettingsContext } from '@/hooks/use-site-settings';

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const query = useQuery({
        queryKey: ['public-settings'],
        queryFn: getPublicSettings,
        staleTime: 60_000,
        refetchInterval: 60_000,
    });
    if (query.isPending) return <AppLoading />;
    if (query.error)
        return <DisplayError error={query.error} fullPage onRetry={() => void query.refetch()} />;
    const settings = query.data;
    return (
        <SiteSettingsContext.Provider value={settings}>
            {settings.announcement && (
                <aside
                    role="status"
                    className="border-input bg-accent text-foreground flex items-center justify-center gap-3 border-b px-5 py-3 text-xs leading-6"
                >
                    <Megaphone size={15} className="shrink-0" />
                    <p className="wrap-break-word">{settings.announcement}</p>
                </aside>
            )}
            {settings.maintenance_notice && (
                <aside
                    role="status"
                    className="border-secondary/20 bg-secondary/10 text-foreground flex items-center justify-center gap-3 border-b px-5 py-3 text-xs leading-6"
                >
                    <Construction size={15} className="text-secondary shrink-0" />
                    <p className="wrap-break-word">{settings.maintenance_notice}</p>
                </aside>
            )}
            {children}
        </SiteSettingsContext.Provider>
    );
}
