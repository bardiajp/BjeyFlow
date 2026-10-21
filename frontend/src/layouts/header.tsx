import { ChevronRight, PanelLeft, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Fragment, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/search-input';
import type { Task } from '@/app/tasks/types';
import { RemindersDropdown } from './reminders';

export function AppHeader({
    title,
    breadcrumbParents,
    search,
    onSearch,
    searchRef,
    onToggleSidebar,
    onCreateTask,
    tasks,
    today,
    onOpenTask,
}: {
    title: string;
    breadcrumbParents: { label: string; to: string }[];
    search: string;
    onSearch: (value: string) => void;
    searchRef: RefObject<HTMLInputElement | null>;
    onToggleSidebar: () => void;
    onCreateTask: () => void;
    tasks: Task[];
    today: string;
    onOpenTask: (id: string) => void;
}) {
    const navigate = useNavigate();
    return (
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8 xl:px-10">
            <div className="flex min-w-0 items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Toggle navigation"
                    onClick={onToggleSidebar}
                >
                    <PanelLeft size={20} strokeWidth={1.5} />
                </Button>
                <nav aria-label="Breadcrumb" className="min-w-0">
                    <ol className="flex min-w-0 items-center gap-2 text-sm sm:gap-3">
                        {breadcrumbParents.map((parent) => (
                            <Fragment key={parent.to}>
                                <li className="shrink-0">
                                    <Link
                                        to={parent.to}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {parent.label}
                                    </Link>
                                </li>
                                <li aria-hidden="true" className="shrink-0">
                                    <ChevronRight size={15} />
                                </li>
                            </Fragment>
                        ))}
                        <li aria-current="page" className="max-w-48 truncate font-medium">
                            {title}
                        </li>
                    </ol>
                </nav>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none sm:gap-4">
                <div className="min-w-0 flex-1">
                    <SearchInput
                        value={search}
                        onChange={onSearch}
                        inputRef={searchRef}
                        onSubmit={() => navigate('/inbox')}
                    />
                </div>
                <RemindersDropdown tasks={tasks} today={today} onOpenTask={onOpenTask} />
                <Button
                    aria-label="Add task"
                    onClick={onCreateTask}
                    className="h-10 shrink-0 gap-2 rounded-xl px-3 sm:px-4"
                >
                    <Plus size={17} />
                    <span className="hidden sm:inline">Add task</span>
                </Button>
            </div>
        </header>
    );
}
