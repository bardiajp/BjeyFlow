import { axiosInstance } from '@/lib/api';
import type { LoginFormValues } from '../schema';
import type { AuthResponse } from '../types';

export async function login(body: LoginFormValues) {
    const { data } = await axiosInstance.post<AuthResponse>('users/auth/login/', body);
    return data;
}
