import {
    BookOpen,
    Briefcase,
    Code,
    Coffee,
    Folder,
    Hash,
    Heart,
    Music,
    Palette,
    Rocket,
    Star,
    Target,
    type LucideIcon,
} from 'lucide-react';
import type { ProjectIconName } from './types';

export const projectIcons: Record<ProjectIconName, { label: string; icon: LucideIcon }> = {
    hash: { label: 'Hash', icon: Hash },
    folder: { label: 'Folder', icon: Folder },
    briefcase: { label: 'Briefcase', icon: Briefcase },
    code: { label: 'Code', icon: Code },
    book: { label: 'Book', icon: BookOpen },
    heart: { label: 'Heart', icon: Heart },
    star: { label: 'Star', icon: Star },
    target: { label: 'Target', icon: Target },
    palette: { label: 'Palette', icon: Palette },
    coffee: { label: 'Coffee', icon: Coffee },
    music: { label: 'Music', icon: Music },
    rocket: { label: 'Rocket', icon: Rocket },
};
