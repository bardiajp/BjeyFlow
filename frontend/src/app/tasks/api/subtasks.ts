import { axiosInstance } from '@/lib/api';
import type { SubTask } from '../types';

export async function deleteSubTask(taskId: string, id: string) {
    await axiosInstance.delete(`api/tasks/${taskId}/subtasks/${id}/`);
}

export async function setSubTaskCompleted(taskId: string, id: string, completed: boolean) {
    return (
        await axiosInstance.patch<SubTask>(`api/tasks/${taskId}/subtasks/${id}/`, {
            is_completed: completed,
        })
    ).data;
}

export async function createSubTask(taskId: string, title: string, position: number) {
    return (await axiosInstance.post<SubTask>(`api/tasks/${taskId}/subtasks/`, { title, position }))
        .data;
}
