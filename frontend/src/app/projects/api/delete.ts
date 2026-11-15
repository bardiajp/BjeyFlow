import { axiosInstance } from '@/lib/api';

export async function deleteProject(id: string) {
    await axiosInstance.delete(`api/projects/${id}/`);
}
