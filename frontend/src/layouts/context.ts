import { useOutletContext } from 'react-router';

export interface TaskLayoutContext {
    search: string;
    today: string;
    openTask: (id: string) => void;
    createTask: (projectId?: string) => void;
    createProject: () => void;
}

export function useTaskLayout() {
    return useOutletContext<TaskLayoutContext>();
}
