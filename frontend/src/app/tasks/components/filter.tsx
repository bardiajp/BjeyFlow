import type { Project } from '@/app/projects/types';
import type { TaskPriority, TaskStatus } from '../types';
import { LabeledSelect } from '@/components/form/labeled-select';
import { Button } from '@/components/ui/button';

export interface TaskFilterValues {
    project: string;
    priority: TaskPriority | '';
    status: TaskStatus | '';
}

export function TaskFilterPanel({
    value,
    onChange,
    projects,
    projectFixed = false,
    completedView = false,
}: {
    value: TaskFilterValues;
    onChange: (value: TaskFilterValues) => void;
    projects: Project[];
    projectFixed?: boolean;
    completedView?: boolean;
}) {
    return (
        <div className="mb-5 grid items-end gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <LabeledSelect
                label="Project"
                value={value.project}
                disabled={projectFixed}
                onChange={(event) => onChange({ ...value, project: event.target.value })}
            >
                <option value="">All projects</option>
                {projects.map((project) => (
                    <option value={project.id} key={project.id}>
                        {project.name}
                    </option>
                ))}
            </LabeledSelect>
            <LabeledSelect
                label="Priority"
                value={value.priority}
                onChange={(event) =>
                    onChange({
                        ...value,
                        priority: event.target.value as TaskFilterValues['priority'],
                    })
                }
            >
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
            </LabeledSelect>
            <LabeledSelect
                label="Status"
                value={completedView ? 'completed' : value.status}
                disabled={completedView}
                onChange={(event) =>
                    onChange({ ...value, status: event.target.value as TaskFilterValues['status'] })
                }
            >
                <option value="">All statuses</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
            </LabeledSelect>
            <Button
                variant="ghost"
                className="mt-2 h-auto min-h-[50px] self-stretch"
                onClick={() => onChange({ project: '', priority: '', status: '' })}
            >
                Clear filters
            </Button>
        </div>
    );
}
