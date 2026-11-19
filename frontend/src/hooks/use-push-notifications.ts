import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { axiosInstance } from '@/lib/api';
import { usePreferences } from '@/store/use-preferences';
import useUserStore from '@/store/use-user-store';

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
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
        'Notification' in window ? Notification.permission : 'unsupported'
    );
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
    useEffect(() => {
        if (!supported) return;
        let active = true;
        const refresh = () => {
            setPermission(Notification.permission);
            void navigator.serviceWorker
                .getRegistration('/')
                .then((registration) => registration?.pushManager.getSubscription())
                .then((value) => {
                    if (active) setSubscription(value ?? null);
                })
                .catch((error: unknown) => console.error('Could not check push subscription:', error));
        };
        refresh();
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refresh();
                void client.invalidateQueries({ queryKey: ['push-devices', userId] });
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            active = false;
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [supported, userId, client]);
    const enable = useMutation({
        mutationFn: async () => {
            if (!config.data?.configured)
                throw new Error('Push notifications are not configured on the server yet.');
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result !== 'granted')
                throw new Error('Allow notifications in your device settings to continue.');
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
                await axiosInstance.post('users/auth/push/test/', { endpoint: subscription.endpoint });
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
