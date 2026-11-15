import { axiosInstance } from '@/lib/api';

export async function requestPasswordReset(email: string) {
    await axiosInstance.post('users/auth/password-reset/', { email });
}

export async function confirmPasswordReset(body: {
    uid: string;
    token: string;
    new_password: string;
}) {
    await axiosInstance.post('users/auth/password-reset/confirm/', body);
}
