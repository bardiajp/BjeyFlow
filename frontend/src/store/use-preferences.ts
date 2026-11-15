import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Preferences {
    theme: 'light' | 'dark' | 'system';
    waterEffects: boolean;
    clickSplash: boolean;
    focusMinutes: number;
    toastDuration: number;
    defaultView: 'list' | 'board' | 'calendar';
    defaultProject: string | null;
    defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
    taskOrdering:
        | 'position,created_at'
        | 'due_date,due_time'
        | '-created_at'
        | 'created_at'
        | 'title'
        | '-title';
    hideCompleted: boolean;
    calendar: 'gregory' | 'persian';
    weekStart: 0 | 1 | 6;
    hourCycle: 'h12' | 'h23';
    timeZone: string;
    browserNotifications: boolean;
    reminderMinutes: number;
    quietHours: boolean;
    quietStart: string;
    quietEnd: string;
}

const defaults: Preferences = {
    theme: 'system',
    waterEffects: true,
    clickSplash: true,
    focusMinutes: 25,
    toastDuration: 5000,
    defaultView: 'list',
    defaultProject: null,
    defaultPriority: 'normal',
    taskOrdering: 'position,created_at',
    hideCompleted: false,
    calendar: 'gregory',
    weekStart: 1,
    hourCycle: 'h23',
    timeZone: 'system',
    browserNotifications: false,
    reminderMinutes: 15,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00',
};

export const usePreferences = create<
    Preferences & {
        setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
        resetPreferences: () => void;
        accountId: string | null;
        pending: Partial<Preferences>;
        syncError: string | null;
        syncing: boolean;
        loadAccount: (id: string, preferences: Partial<Preferences>) => void;
        receivePreferences: (preferences: Partial<Preferences>) => void;
        acknowledge: (sent: Partial<Preferences>, preferences: Partial<Preferences>) => void;
    }
>()(
    persist(
        (set, get) => ({
            ...defaults,
            accountId: null,
            pending: {},
            syncError: null,
            syncing: false,
            setPreference: (key, value) =>
                set((state) => ({
                    [key]: value,
                    pending: { ...state.pending, [key]: value },
                    syncError: null,
                })),
            resetPreferences: () => set({ ...defaults, pending: { ...defaults }, syncError: null }),
            loadAccount: (id, preferences) =>
                set((state) => ({
                    ...defaults,
                    ...preferences,
                    ...(state.accountId === id ? state.pending : {}),
                    accountId: id,
                    pending: state.accountId === id ? state.pending : {},
                    syncError: null,
                    syncing: false,
                })),
            receivePreferences: (preferences) =>
                set((state) => ({ ...defaults, ...preferences, ...state.pending })),
            acknowledge: (sent, preferences) => {
                const pending = { ...get().pending };
                for (const key of Object.keys(sent) as (keyof Preferences)[]) {
                    if (pending[key] === sent[key]) delete pending[key];
                }
                set({ ...defaults, ...preferences, ...pending, pending, syncError: null });
            },
        }),
        {
            name: 'bjeyflow-preferences',
            partialize: (state) => {
                const values = Object.fromEntries(
                    Object.keys(defaults).map((key) => [key, state[key as keyof Preferences]])
                );
                return { ...values, accountId: state.accountId, pending: state.pending };
            },
        }
    )
);

export function applyTheme(theme = usePreferences.getState().theme) {
    const dark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}
