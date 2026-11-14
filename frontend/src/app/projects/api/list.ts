import { getAllPages } from '@/lib/pagination';
import type { Project } from '../types';

export async function listProjects() {
    return (await getAllPages<Project>('api/projects/')).results;
}
