import { getAllPages } from '@/lib/pagination';
import type { Task, TaskFilters } from '../types';

export async function listTasks(filters: TaskFilters = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
    });
    const suffix = query.size ? `?${query}` : '';
    return (await getAllPages<Task>(`api/tasks/${suffix}`)).results;
}
