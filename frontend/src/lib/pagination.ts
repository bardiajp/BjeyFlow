import { axiosInstance } from '@/lib/api';
import type { Pagination } from '@/lib/type';

export async function getAllPages<T>(url: string): Promise<Pagination<T[]>> {
    const results: T[] = [];
    const visited = new Set<string>();
    let next: string | null = url;
    let count = 0;

    while (next) {
        if (visited.has(next)) {
            throw new Error('The API returned a repeated pagination link.');
        }
        visited.add(next);
        const { data }: { data: Pagination<T[]> } = await axiosInstance.get<Pagination<T[]>>(next);
        count = data.count;
        results.push(...data.results);
        next = data.next
            ? `${url.split('?')[0]}${new URL(data.next, 'http://pagination.local').search}`
            : null;
    }

    return { count, next: null, previous: null, results };
}
