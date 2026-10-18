import { axiosInstance } from '@/lib/api';
import type { CreatePanelUser, PanelUser, UpdatePanelUser } from '../types';

export async function createPanelUser(body: CreatePanelUser) {
    const { data } = await axiosInstance.post<PanelUser>('users/', body);
    return data;
}

export async function updatePanelUser(id: string, body: UpdatePanelUser) {
    const { data } = await axiosInstance.patch<PanelUser>(`users/${id}/`, body);
    return data;
}

export async function resetPanelUserPassword(id: string, newPassword: string) {
    await axiosInstance.post(`users/${id}/reset-password/`, { new_password: newPassword });
}

export async function deletePanelUser(id: string) {
    await axiosInstance.delete(`users/${id}/`);
}
