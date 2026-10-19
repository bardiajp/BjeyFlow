import { Hash } from 'lucide-react';
import type { ProjectIconName } from '../types';
import { projectIcons } from '../icons';

export function ProjectIcon({
    name,
    size = 16,
    color,
}: {
    name?: ProjectIconName;
    size?: number;
    color?: string;
}) {
    const Icon = projectIcons[name ?? 'hash']?.icon ?? Hash;
    return (
        <Icon
            size={size}
            strokeWidth={1.5}
            style={color ? { color } : undefined}
            aria-hidden="true"
        />
    );
}
