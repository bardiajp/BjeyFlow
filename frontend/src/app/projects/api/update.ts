import { axiosInstance } from '@/lib/api';
import type { CreateProject, Project } from '../types';

export async function updateProject(id: string, body: CreateProject) {
    return (await axiosInstance.patch<Project>(`api/projects/${id}/`, body)).data;
}
