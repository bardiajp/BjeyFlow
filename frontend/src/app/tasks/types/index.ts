export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskView = 'inbox' | 'today' | 'upcoming' | 'completed' | 'project';

export interface SubTask {
    id: string;
    task: string;
    title: string;
    is_completed: boolean;
    position: number;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    project: string;
    project_name: string;
    project_icon: ProjectIconName;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    due_time: string | null;
    position: number;
    completed_at: string | null;
    subtasks: SubTask[];
    subtasks_count: number;
    completed_subtasks_count: number;
    created_at: string;
    updated_at: string;
}

export interface TaskFilters {
    project?: string;
    due_date?: string;
    due_date_after?: string;
    due_date_before?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    search?: string;
    ordering?: string;
}

export type TaskInput = Pick<
    Task,
    'project' | 'title' | 'description' | 'priority' | 'status' | 'due_date' | 'due_time'
>;
export type CreateTask = TaskInput & {
    subtasks: { title: string; position: number; is_completed?: boolean }[];
};
import type { ProjectIconName } from '@/app/projects/types';
