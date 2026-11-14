export type ProjectIconName =
    | 'hash'
    | 'folder'
    | 'briefcase'
    | 'code'
    | 'book'
    | 'heart'
    | 'star'
    | 'target'
    | 'palette'
    | 'coffee'
    | 'music'
    | 'rocket';

export interface Project {
    id: string;
    owner: string;
    name: string;
    description: string;
    icon: ProjectIconName;
    color: string;
    position: number;
    is_archived: boolean;
    tasks_count: number;
    created_at: string;
    updated_at: string;
}

export type CreateProject = Pick<Project, 'name' | 'description' | 'color' | 'icon'>;
