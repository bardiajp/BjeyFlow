import type { ReactNode } from 'react';
import AuthProvider from './auth';
import QueryProvider from './query';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
    );
}
