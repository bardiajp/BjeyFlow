import { axiosInstance } from '@/lib/api';
import type { PanelUser } from '../types';

export async function disablePanelUser(id: string) {
    const { data } = await axiosInstance.post<PanelUser>(`users/${id}/disable/`);
    return data;
}
