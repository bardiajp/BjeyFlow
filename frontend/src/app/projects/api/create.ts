import { axiosInstance } from '@/lib/api';
import type { CreateProject, Project } from '../types';

export async function createProject(body: CreateProject) {
    return (await axiosInstance.post<Project>('api/projects/', body)).data;
}
