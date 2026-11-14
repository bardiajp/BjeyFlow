import type { Project } from '@/app/projects/types';
import type { TaskPriority, TaskStatus } from '../types';
import { useId } from 'react';
import {
    CircleCheck,
    CircleDashed,
    Flag,
    FolderOpen,
    Layers,
    RotateCcw,
    Timer,
} from 'lucide-react';
import { TaskControlOption } from './control-dropdown';
import { ProjectIcon } from '@/app/projects/components/project-icon';

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
    const id = useId();
    return (
        <div className="grid gap-3 pt-1">
            <fieldset className="min-w-0 rounded-2xl border border-slate-200/70 bg-white p-1.5">
                <legend className="ml-2 px-1.5 text-[9px] font-semibold tracking-[0.1em] text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <FolderOpen size={11} />
                        PROJECT
                    </span>
                </legend>
                <div className="grid max-h-44 [scrollbar-width:thin] gap-0.5 overflow-y-auto overscroll-contain">
                    {[{ id: '', name: 'All projects' }, ...projects].map((project) => (
                        <TaskControlOption
                            key={project.id}
                            name={`${id}-project`}
                            value={project.id}
                            checked={value.project === project.id}
                            disabled={projectFixed}
                            icon={
                                'icon' in project ? (
                                    <ProjectIcon name={project.icon} size={14} />
                                ) : (
                                    <Layers size={14} />
                                )
                            }
                            onChange={() => onChange({ ...value, project: project.id })}
                        >
                            {project.name}
                        </TaskControlOption>
                    ))}
                </div>
                {projectFixed && (
                    <p className="px-3 py-2 text-[9px] text-slate-400">
                        You’re viewing this project.
                    </p>
                )}
            </fieldset>
            <fieldset className="min-w-0 rounded-2xl border border-slate-200/70 bg-white p-1.5">
                <legend className="ml-2 px-1.5 text-[9px] font-semibold tracking-[0.1em] text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <Flag size={11} />
                        PRIORITY
                    </span>
                </legend>
                <div className="grid grid-cols-2 gap-1">
                    {(
                        [
                            { value: 'low', label: 'Low', color: 'bg-emerald-400' },
                            { value: 'normal', label: 'Normal', color: 'bg-primary' },
                            { value: 'high', label: 'High', color: 'bg-orange-400' },
                            { value: 'urgent', label: 'Urgent', color: 'bg-destructive' },
                        ] as const
                    ).map((option) => (
                        <TaskControlOption
                            key={option.value}
                            name={`${id}-priority`}
                            value={option.value}
                            checked={value.priority === option.value}
                            onChange={() => onChange({ ...value, priority: option.value })}
                        >
                            <span className="flex items-center gap-2">
                                <span className={`size-2 rounded-full ${option.color}`} />
                                {option.label}
                            </span>
                        </TaskControlOption>
                    ))}
                </div>
                {value.priority && (
                    <button
                        type="button"
                        onClick={() => onChange({ ...value, priority: '' })}
                        className="flow-control mx-2 mt-1 rounded-lg border border-transparent px-2 py-1.5 text-[9px] text-slate-400 outline-none"
                    >
                        Clear priority
                    </button>
                )}
            </fieldset>
            <fieldset className="min-w-0 rounded-2xl border border-slate-200/70 bg-white p-1.5">
                <legend className="ml-2 px-1.5 text-[9px] font-semibold tracking-[0.1em] text-slate-400">
                    <span className="flex items-center gap-1.5">
                        <CircleDashed size={11} />
                        STATUS
                    </span>
                </legend>
                {(
                    [
                        { value: '', label: 'All statuses', icon: Layers },
                        { value: 'todo', label: 'To do', icon: CircleDashed },
                        { value: 'in_progress', label: 'In progress', icon: Timer },
                        { value: 'completed', label: 'Completed', icon: CircleCheck },
                    ] as const
                ).map((option) => (
                    <TaskControlOption
                        key={option.value}
                        name={`${id}-status`}
                        value={option.value}
                        checked={(completedView ? 'completed' : value.status) === option.value}
                        disabled={completedView}
                        icon={<option.icon size={14} />}
                        onChange={() => onChange({ ...value, status: option.value })}
                    >
                        {option.label}
                    </TaskControlOption>
                ))}
            </fieldset>
            <div className="border-t border-slate-200/70 pt-2">
                <button
                    type="button"
                    className="flow-control text-primary-foreground flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white py-2.5 text-[11px] font-medium outline-none"
                    onClick={() =>
                        onChange({
                            project: projectFixed ? value.project : '',
                            priority: '',
                            status: completedView ? 'completed' : '',
                        })
                    }
                >
                    <RotateCcw size={13} aria-hidden="true" />
                    Reset filters
                </button>
            </div>
        </div>
    );
}
