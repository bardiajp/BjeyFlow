import { getAllPages } from '@/lib/pagination';
import type { PanelUser } from '../types';

export async function listUsers() {
    const data = await getAllPages<PanelUser>('users/');
    return data.results;
}
