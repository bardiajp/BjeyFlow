import { axiosInstance } from '@/lib/api';
import type { AuthResponse, User } from '@/app/users/types';
import type { Preferences } from '@/store/use-preferences';

export type ProfileValues = Pick<User, 'display_name' | 'avatar' | 'flow_name' | 'north_star'>;

export async function updateProfile(values: ProfileValues) {
    return (await axiosInstance.patch<AuthResponse>('users/auth/profile/', values)).data;
}

export async function getPreferences() {
    return (await axiosInstance.get<Partial<Preferences>>('users/auth/preferences/')).data;
}

export async function savePreferences(values: Partial<Preferences>) {
    return (await axiosInstance.patch<Partial<Preferences>>('users/auth/preferences/', values))
        .data;
}

export interface AccountSession {
    id: string;
    user_agent: string;
    ip_address: string | null;
    created_at: string;
    last_seen: string;
    expires_at: string;
    current: boolean;
}

export async function getSessions() {
    return (await axiosInstance.get<AccountSession[]>('users/auth/sessions/')).data;
}

export async function revokeSession(id?: string) {
    await axiosInstance.delete(id ? `users/auth/sessions/${id}/` : 'users/auth/sessions/');
}
