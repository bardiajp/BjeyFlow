import { axiosInstance } from '@/lib/api';
import type { PanelUser } from '../types';

export async function activatePanelUser(id: string) {
    const { data } = await axiosInstance.post<PanelUser>(`users/${id}/activate/`);
    return data;
}
