import { useEffect, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPreferences, savePreferences } from '@/app/settings/api';
import { usePreferences, type Preferences } from '@/store/use-preferences';
import useUserStore from '@/store/use-user-store';
import { errorMessage } from '@/lib/error-message';

export function PreferencesProvider({ children }: { children: ReactNode }) {
    const user = useUserStore((state) => state.user);
    const pending = usePreferences((state) => state.pending);
    const syncError = usePreferences((state) => state.syncError);
    const syncing = usePreferences((state) => state.syncing);
    const accountId = user?.id;
    const client = useQueryClient();
    const query = useQuery({
        queryKey: ['account-preferences', accountId],
        queryFn: getPreferences,
        enabled: !!accountId && !syncing && Object.keys(pending).length === 0,
        staleTime: 30_000,
        refetchInterval: 60_000,
    });
    const mutation = useMutation({
        mutationFn: (values: Partial<Preferences>) => savePreferences(values),
        onMutate: async () => {
            usePreferences.setState({ syncing: true });
            await client.cancelQueries({ queryKey: ['account-preferences', accountId] });
        },
        onSuccess: (data, sent) => {
            if (useUserStore.getState().user?.id === accountId) {
                usePreferences.getState().acknowledge(sent, data);
                client.setQueryData(['account-preferences', accountId], data);
            }
        },
        onError: (error) => {
            if (useUserStore.getState().user?.id === accountId)
                usePreferences.setState({ syncError: errorMessage(error) });
        },
        onSettled: () => {
            if (useUserStore.getState().user?.id === accountId)
                usePreferences.setState({ syncing: false });
        },
    });
    const { mutate, isPending } = mutation;

    useEffect(() => {
        if (query.data && accountId === usePreferences.getState().accountId)
            usePreferences.getState().receivePreferences(query.data);
    }, [query.data, accountId]);

    useEffect(() => {
        if (!accountId || isPending || syncError || Object.keys(pending).length === 0) return;
        const timer = window.setTimeout(() => mutate(pending), 500);
        return () => window.clearTimeout(timer);
    }, [accountId, isPending, mutate, pending, syncError]);

    return children;
}
