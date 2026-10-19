import { NavLink } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavItem({
    to,
    label,
    icon: Icon,
    count,
    project = false,
    onNavigate,
    iconColor,
    className,
    countClassName,
}: {
    to: string;
    label: string;
    icon: LucideIcon;
    count?: number;
    project?: boolean;
    onNavigate?: () => void;
    iconColor?: string;
    className?: string;
    countClassName?: string;
}) {
    return (
        <NavLink
            to={to}
            end={to !== '/settings'}
            onClick={onNavigate}
            className={({ isActive }) =>
                cn(
                    'flex min-h-11 items-center gap-3 rounded-[10px] border border-neutral-500 px-3.5 py-2.5 text-sm transition-colors',
                    project
                        ? 'hover:bg-muted/60 border-transparent bg-[#ebebeb]'
                        : 'hover:bg-primary/15',
                    isActive &&
                        (project
                            ? 'bg-primary/55 hover:bg-muted/60 font-semibold'
                            : 'bg-primary/55 hover:bg-primary/55 font-semibold'),
                    className
                )
            }
        >
            <Icon
                size={19}
                strokeWidth={1.5}
                className="shrink-0"
                style={iconColor ? { color: iconColor } : undefined}
            />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {count !== undefined && (
                <span
                    data-slot="nav-count"
                    className={cn(
                        'w-7 shrink-0 text-center text-xs tabular-nums transition-opacity',
                        countClassName
                    )}
                >
                    {count}
                </span>
            )}
        </NavLink>
    );
}
