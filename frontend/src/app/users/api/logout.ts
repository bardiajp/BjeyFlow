import { axiosInstance } from '@/lib/api';

export async function logout() {
    await axiosInstance.post('users/auth/logout/');
}
