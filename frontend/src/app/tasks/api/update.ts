import { axiosInstance } from '@/lib/api';
import type { Task, TaskInput } from '../types';

export async function updateTask(id: string, body: Partial<TaskInput>) {
    return (await axiosInstance.patch<Task>(`api/tasks/${id}/`, body)).data;
}
