import type { ReactNode } from 'react';
import AuthProvider from './auth';
import QueryProvider from './query';
import { Toaster } from '@/components/ui/toast';
import { AppearanceProvider } from './appearance';
import { usePreferences } from '@/store/use-preferences';

export default function Providers({ children }: { children: ReactNode }) {
    const toastDuration = usePreferences((state) => state.toastDuration);
    return (
        <AppearanceProvider>
            <Toaster timeout={toastDuration}>
                <QueryProvider>
                    <AuthProvider>{children}</AuthProvider>
                </QueryProvider>
            </Toaster>
        </AppearanceProvider>
    );
}
