import type { ProjectIconName } from '../types';
import { projectIcons } from '../icons';
import { Button } from '@/components/ui/button';
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
    return (
        <div className="grid gap-2">
            <span className="text-sm font-medium" id="project-icon-label">
                Project icon
            </span>
            <div
                className="grid grid-cols-6 gap-2"
                role="group"
                aria-labelledby="project-icon-label"
            >
                {Object.entries(projectIcons).map(([name, { icon: Icon, label }]) => (
                    <Button
                        key={name}
                        type="button"
                        variant="outline"
                        aria-label={`Use ${label} icon`}
                        aria-pressed={value === name}
                        disabled={disabled}
                        className={cn(
                            'h-10 px-0',
                            value === name && 'border-primary bg-primary/30 ring-primary ring-1'
                        )}
                        onClick={() => onChange(name as ProjectIconName)}
                    >
                        <Icon size={18} strokeWidth={1.5} />
                    </Button>
                ))}
            </div>
        </div>
    );
}
