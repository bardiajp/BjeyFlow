import type { ProjectIconName } from '../types';
import { projectIcons } from '../icons';
import { Check } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export function ProjectIconPicker({
    value,
    onChange,
    disabled,
}: {
    value: ProjectIconName;
    onChange: (icon: ProjectIconName) => void;
    disabled?: boolean;
}) {
    const labelId = useId();
    return (
        <div className="grid gap-3">
            <span className="text-[11px] font-medium text-slate-500" id={labelId}>
                Project icon
            </span>
            <div
                className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                role="group"
                aria-labelledby={labelId}
            >
                {Object.entries(projectIcons).map(([name, { icon: Icon, label }]) => (
                    <button
                        key={name}
                        type="button"
                        aria-label={`Use ${label} icon`}
                        aria-pressed={value === name}
                        disabled={disabled}
                        className={cn(
                            'flow-control flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-[11px] text-slate-500 outline-none disabled:cursor-not-allowed disabled:opacity-50',
                            value === name &&
                                'border-primary/60 bg-primary/15 text-primary-foreground font-medium'
                        )}
                        onClick={() => onChange(name as ProjectIconName)}
                    >
                        <Icon size={16} strokeWidth={1.7} aria-hidden="true" className="shrink-0" />
                        <span className="truncate">{label}</span>
                        {value === name && (
                            <Check
                                size={15}
                                strokeWidth={2.5}
                                aria-hidden="true"
                                className="ml-auto shrink-0"
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
