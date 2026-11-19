import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { axiosInstance } from '@/lib/api';
import { usePreferences } from '@/store/use-preferences';
import useUserStore from '@/store/use-user-store';
import { readPushDevice } from '@/lib/push-device';

interface PushConfig {
    configured: boolean;
    public_key: string;
}

function applicationKey(value: string) {
    const data = atob(
        value
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(value.length / 4) * 4, '=')
    );
    return Uint8Array.from(data, (char) => char.charCodeAt(0));
}

export function usePushNotifications() {
    const userId = useUserStore((state) => state.user?.id);
    const client = useQueryClient();
    const supported =
        window.isSecureContext &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window &&
        import.meta.env.PROD;
    const config = useQuery({
        queryKey: ['push-config'],
        queryFn: async () => (await axiosInstance.get<PushConfig>('users/auth/push/config/')).data,
        enabled: !!userId && supported,
        staleTime: 300_000,
    });
    const devices = useQuery({
        queryKey: ['push-devices', userId],
        queryFn: async () =>
            (await axiosInstance.get<string[]>('users/auth/push/subscriptions/')).data,
        enabled: !!userId && supported,
        staleTime: 30_000,
    });
    const browserKey = ['browser-push-device', userId];
    const browser = useQuery({
        queryKey: browserKey,
        queryFn: () => readPushDevice(navigator.serviceWorker.ready, () => Notification.permission),
        enabled: !!userId && supported,
        staleTime: 30_000,
        retry: false,
    });
    const subscription = browser.data?.subscription ?? null;
    const permission =
        browser.data?.permission ??
        ('Notification' in window ? Notification.permission : 'unsupported');
    const setSubscription = (value: PushSubscription | null) => {
        client.setQueryData(browserKey, {
            subscription: value,
            permission: Notification.permission,
        });
    };
    const sessionSync = useQuery({
        queryKey: ['push-session-sync', userId, subscription?.endpoint],
        queryFn: async () => {
            try {
                await axiosInstance.patch('users/auth/push/subscriptions/', {
                    endpoint: subscription!.endpoint,
                });
                return true;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    await client.invalidateQueries({ queryKey: ['push-devices', userId] });
                }
                throw error;
            }
        },
        enabled:
            !!userId &&
            supported &&
            permission === 'granted' &&
            !!subscription &&
            !!devices.data?.includes(subscription.endpoint),
        staleTime: Infinity,
        retry: false,
    });
    useEffect(() => {
        if (!supported || !userId) return;
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void client.invalidateQueries({ queryKey: ['browser-push-device', userId] });
                void client.invalidateQueries({ queryKey: ['push-devices', userId] });
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [supported, userId, client]);
    const enable = useMutation({
        mutationFn: async () => {
            if (!config.data?.configured)
                throw new Error('Push notifications are not configured on the server yet.');
            const result = await Notification.requestPermission();
            client.setQueryData(browserKey, { subscription, permission: result });
            if (result !== 'granted')
                throw new Error('Allow notifications in your device settings to continue.');
            await client.cancelQueries({ queryKey: browserKey });
            const registration = await navigator.serviceWorker.ready;
            const existing = await registration.pushManager.getSubscription();
            const current =
                existing ??
                (await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: applicationKey(config.data.public_key)
                        .buffer as ArrayBuffer,
                }));
            const keys = current.toJSON().keys!;
            await axiosInstance.post('users/auth/push/subscriptions/', {
                endpoint: current.endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            setSubscription(current);
            usePreferences.getState().setPreference('browserNotifications', true);
            await client.invalidateQueries({ queryKey: ['push-devices', userId] });
        },
    });
    const disable = useMutation({
        mutationFn: async () => {
            if (!subscription) return;
            await client.cancelQueries({ queryKey: browserKey });
            await axiosInstance.delete('users/auth/push/subscriptions/', {
                data: { endpoint: subscription.endpoint },
            });
            await subscription.unsubscribe();
            setSubscription(null);
            await client.invalidateQueries({ queryKey: ['push-devices', userId] });
        },
    });
    const sendTest = useMutation({
        mutationFn: async () => {
            if (!subscription) throw new Error('Enable notifications on this device first.');
            try {
                await axiosInstance.post('users/auth/push/test/', {
                    endpoint: subscription.endpoint,
                });
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 410) {
                    await subscription.unsubscribe();
                    setSubscription(null);
                    await client.invalidateQueries({ queryKey: ['push-devices', userId] });
                }
                throw error;
            }
        },
    });
    return {
        supported,
        config,
        permission,
        subscription,
        browser,
        sessionSync,
        checking:
            supported && !!userId && (browser.isPending || devices.isPending || config.isPending),
        enabled:
            !!subscription &&
            !!devices.data?.includes(subscription.endpoint) &&
            permission === 'granted',
        devices,
        enable,
        disable,
        sendTest,
    };
}
