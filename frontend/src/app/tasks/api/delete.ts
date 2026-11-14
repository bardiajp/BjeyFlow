import { axiosInstance } from '@/lib/api';

export async function deleteTask(id: string) {
    await axiosInstance.delete(`api/tasks/${id}/`);
}
