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
    collapsed = false,
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
    collapsed?: boolean;
}) {
    return (
        <NavLink
            to={to}
            end={to !== '/settings' && to !== '/admin'}
            onClick={onNavigate}
            aria-label={collapsed ? label : undefined}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
                cn(
                    'group/nav focus-visible:ring-primary-foreground/40 relative flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 py-2 text-[13px] transition-colors duration-200 outline-none focus-visible:ring-2 motion-reduce:transition-none',
                    project
                        ? 'hover:text-primary-foreground hover:bg-card/80 text-slate-600'
                        : 'hover:text-primary-foreground hover:bg-card/80 font-medium text-slate-600',
                    isActive &&
                        (project
                            ? 'text-primary-foreground bg-card hover:bg-card font-semibold shadow-[0_2px_8px_-3px_#02304720]'
                            : 'bg-brand hover:bg-brand text-white shadow-[0_5px_14px_-5px_#02304760] hover:text-white'),
                    className
                )
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                            project
                                ? 'bg-white/90'
                                : isActive
                                  ? 'text-primary bg-white/10'
                                  : 'bg-white/80 text-slate-500'
                        )}
                        style={
                            iconColor
                                ? {
                                      color: iconColor,
                                      backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
                                  }
                                : undefined
                        }
                    >
                        <Icon size={17} strokeWidth={1.7} />
                    </span>
                    <span
                        className={cn(
                            'sidebar-copy min-w-0 flex-1 truncate',
                            count !== undefined && 'pr-7'
                        )}
                    >
                        {label}
                    </span>
                    {count !== undefined && (
                        <span
                            data-slot="nav-count"
                            className={cn(
                                'sidebar-copy absolute right-3 min-w-6 rounded-md px-1.5 py-0.5 text-center text-[11px] font-medium tabular-nums',
                                isActive && !project
                                    ? 'text-primary bg-white/10'
                                    : 'text-slate-400',
                                countClassName
                            )}
                        >
                            {count}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
}
