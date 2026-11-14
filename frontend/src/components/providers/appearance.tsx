import { useEffect, type ReactNode } from 'react';
import { applyTheme, usePreferences } from '@/store/use-preferences';

export function AppearanceProvider({ children }: { children: ReactNode }) {
    const theme = usePreferences((state) => state.theme);
    useEffect(() => {
        applyTheme(theme);
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const update = () => applyTheme(theme);
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, [theme]);
    return children;
}
