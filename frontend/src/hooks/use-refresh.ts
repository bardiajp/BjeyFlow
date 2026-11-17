import { useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';

type RefreshMessage = {
    type: 'success' | 'warning';
    title: string;
    description: string;
};

export function useRefresh(
    refresh: () => Promise<RefreshMessage | void>,
    successTitle = 'Refresh complete'
) {
    const [refreshing, setRefreshing] = useState(false);
    const running = useRef(false);

    const run = async () => {
        if (running.current) return;
        running.current = true;
        setRefreshing(true);
        const [result] = await Promise.allSettled([
            refresh(),
            new Promise<void>((resolve) => setTimeout(resolve, 1000)),
        ]);
        setRefreshing(false);
        running.current = false;
        if (result.status === 'rejected') {
            toast.add({
                type: 'destructive',
                title: 'Refresh failed',
                description: 'The latest data could not be loaded. Please try again.',
            });
            return;
        }
        toast.add(result.value ?? {
            type: 'success',
            title: successTitle,
            description: 'The latest data is ready.',
        });
    };

    return { refreshing, refresh: run };
}
