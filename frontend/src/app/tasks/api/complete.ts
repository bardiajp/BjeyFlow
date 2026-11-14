import { axiosInstance } from '@/lib/api';
import type { Task } from '../types';

export async function setTaskCompleted(id: string, completed: boolean) {
    return (await axiosInstance.post<Task>(`api/tasks/${id}/${completed ? 'complete' : 'reopen'}/`))
        .data;
}
