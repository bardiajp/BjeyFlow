import { create } from 'zustand';
import type { User } from '@/app/users/types';
import { usePreferences } from './use-preferences';

interface StoreType {
    user: User | null | undefined;
    setUser: (user: User | null) => void;
    clearUser: () => void;
}

const useUserStore = create<StoreType>((set, get) => ({
    user: undefined,
    setUser: (user) => {
        if (user && get().user?.id !== user.id)
            usePreferences.getState().loadAccount(user.id, user.preferences);
        set({ user });
    },
    clearUser: () => set({ user: null }),
}));

export default useUserStore;
