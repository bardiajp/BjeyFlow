import { axiosInstance } from '@/lib/api';
import { getAllPages } from '@/lib/pagination';
import type { Task } from '../types';

export async function listTrash() {
    return (await getAllPages<Task>('api/tasks/trash/')).results;
}

export async function restoreTask(id: string) {
    await axiosInstance.post(`api/tasks/${id}/restore/`);
}

export async function permanentlyDeleteTask(id: string) {
    await axiosInstance.delete(`api/tasks/${id}/permanent/`);
}
