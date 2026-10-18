import { axiosInstance } from '@/lib/api';
import type { AuthResponse } from '../types';

export async function me() {
    const { data } = await axiosInstance.get<AuthResponse>('users/auth/me/');
    return data;
}
