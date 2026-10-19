import { Bell, ChevronRight, PanelLeft, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/search-input';

export function AppHeader({
    title,
    search,
    onSearch,
    searchRef,
    onToggleSidebar,
    onCreateTask,
    onReminders,
}: {
    title: string;
    search: string;
    onSearch: (value: string) => void;
    searchRef: RefObject<HTMLInputElement | null>;
    onToggleSidebar: () => void;
    onCreateTask: () => void;
    onReminders: () => void;
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
                <Link to="/inbox" className="hidden text-sm sm:inline">
                    My projects
                </Link>
                <ChevronRight size={15} className="hidden sm:block" />
                <span className="max-w-48 truncate text-sm font-medium">{title}</span>
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
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Task reminders"
                    onClick={onReminders}
                >
                    <Bell size={20} strokeWidth={1.5} />
                </Button>
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
