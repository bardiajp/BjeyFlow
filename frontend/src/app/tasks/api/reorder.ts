import { axiosInstance } from '@/lib/api';
import type { TaskStatus } from '../types';

export async function reorderBoard(items: { id: string; status: TaskStatus; position: number }[]) {
    await axiosInstance.post('api/tasks/reorder/', { items });
}

export async function reorderSubTasks(taskId: string, ids: string[]) {
    await axiosInstance.post(`api/tasks/${taskId}/subtasks/reorder/`, { ids });
}
