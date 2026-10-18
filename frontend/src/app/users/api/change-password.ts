import { axiosInstance } from '@/lib/api';
import type { ChangePasswordValues } from '../types';

export async function changePassword(body: ChangePasswordValues) {
    await axiosInstance.post('users/auth/change-password/', body);
}
