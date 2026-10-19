import { axiosInstance } from '@/lib/api';
import type { CreateTask, Task } from '../types';

export async function createTask(body: CreateTask) {
    return (await axiosInstance.post<Task>('api/tasks/', body)).data;
}
