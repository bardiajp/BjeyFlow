import { usePushNotifications } from '@/hooks/use-push-notifications';
import type { ReactNode } from 'react';

// Keep device registration checked even when the user never visits Settings.
export function PushNotificationsProvider({ children }: { children: ReactNode }) {
    usePushNotifications();
    return children;
}
