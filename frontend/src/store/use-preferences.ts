import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Preferences {
    theme: 'light' | 'dark' | 'system';
    waterEffects: boolean;
    clickSplash: boolean;
    focusMinutes: number;
    toastDuration: number;
    defaultView: 'list' | 'board' | 'calendar';
}

const defaults: Preferences = {
    theme: 'system',
    waterEffects: true,
    clickSplash: true,
    focusMinutes: 25,
    toastDuration: 5000,
    defaultView: 'list',
};

export const usePreferences = create<
    Preferences & {
        setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
        resetPreferences: () => void;
    }
>()(
    persist(
        (set) => ({
            ...defaults,
            setPreference: (key, value) => set({ [key]: value }),
            resetPreferences: () => set(defaults),
        }),
        { name: 'bjeyflow-preferences' }
    )
);

export function applyTheme(theme = usePreferences.getState().theme) {
    const dark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}
