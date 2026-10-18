import { create } from 'zustand';
import type { User } from '@/app/users/types';

interface StoreType {
    user: User | null | undefined;
    setUser: (user: User | null) => void;
    clearUser: () => void;
}

const useUserStore = create<StoreType>((set) => ({
    user: undefined,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
}));

export default useUserStore;
