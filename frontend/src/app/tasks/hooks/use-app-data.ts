import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@/app/projects/api/list';
import { listTasks } from '../api/list';

export function useAppData() {
    const projects = useQuery({ queryKey: ['projects'], queryFn: listProjects, staleTime: 30_000 });
    const tasks = useQuery({
        queryKey: ['tasks', 'all'],
        queryFn: () => listTasks(),
        staleTime: 30_000,
    });
    return { projects, tasks };
}
