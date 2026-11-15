import { ChevronRight, PanelLeft, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Fragment, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/search-input';
import type { Task } from '@/app/tasks/types';
import { RemindersDropdown } from './reminders';
import { TopbarWater } from './topbar-water';
import { HelpPopover } from './help';

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
    helpOpen,
    onHelpOpenChange,
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
    helpOpen: boolean;
    onHelpOpenChange: (open: boolean) => void;
}) {
    const navigate = useNavigate();
    return (
        <header className="surface-wash border-input sticky top-[max(0.5rem,env(safe-area-inset-top))] z-30 mx-3 mt-[max(0.75rem,env(safe-area-inset-top))] flex min-h-0 flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 shadow-[0_4px_24px_-12px_#02304725] backdrop-blur-xl sm:top-3 sm:mx-6 sm:mt-4 sm:min-h-20 sm:gap-4 sm:rounded-[22px] sm:px-4 sm:py-3.5 lg:mx-7 xl:mx-8">
            <TopbarWater />
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Toggle navigation"
                    title="Toggle navigation"
                    className="text-primary-foreground border-input bg-card size-10 shrink-0 rounded-xl border"
                    onClick={onToggleSidebar}
                >
                    <PanelLeft size={20} strokeWidth={1.5} />
                </Button>
                <span aria-hidden="true" className="h-8 w-px shrink-0 bg-slate-200/80" />
                <div className="min-w-0">
                    <p className="mb-1.5 text-[8px] font-semibold tracking-[0.18em] text-slate-400">
                        YOUR WORKSPACE
                    </p>
                    <nav aria-label="Breadcrumb" className="min-w-0">
                        <ol className="flex min-w-0 items-center gap-1.5 text-xs sm:gap-2">
                            {breadcrumbParents.map((parent) => (
                                <Fragment key={parent.to}>
                                    <li className="shrink-0">
                                        <Link
                                            to={parent.to}
                                            className="hover:text-primary-foreground focus-visible:outline-primary rounded text-slate-400 transition-colors"
                                        >
                                            {parent.label}
                                        </Link>
                                    </li>
                                    <li aria-hidden="true" className="shrink-0 text-slate-300">
                                        <ChevronRight size={12} />
                                    </li>
                                </Fragment>
                            ))}
                            <li
                                aria-current="page"
                                className="text-primary-foreground max-w-40 truncate text-[13px] font-semibold"
                            >
                                {title}
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>
            <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto sm:flex-1 lg:flex-none">
                <div className="min-w-0 flex-1">
                    <SearchInput
                        value={search}
                        onChange={onSearch}
                        inputRef={searchRef}
                        onSubmit={() => navigate('/inbox')}
                    />
                </div>
                <RemindersDropdown tasks={tasks} today={today} onOpenTask={onOpenTask} />
                <HelpPopover open={helpOpen} onOpenChange={onHelpOpenChange} />
                <span
                    aria-hidden="true"
                    className="mx-1 hidden h-6 w-px bg-slate-200/80 sm:block"
                />
                <Button
                    aria-label="Add task"
                    onClick={onCreateTask}
                    title="Add task (N)"
                    className="group bg-brand hover:bg-brand/90 h-11 shrink-0 gap-2.5 rounded-xl px-2.5 text-white shadow-[0_4px_12px_-4px_#02304750] transition-[background-color,box-shadow] duration-300 hover:shadow-[0_6px_16px_-4px_#02304760] sm:pr-3.5"
                >
                    <span className="flex size-6 items-center justify-center rounded-lg bg-white/10">
                        <Plus
                            size={16}
                            className="transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none"
                        />
                    </span>
                    <span className="hidden sm:inline">Add task</span>
                    <kbd
                        aria-hidden="true"
                        className="text-primary ml-1 hidden rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-sans text-[10px] 2xl:inline"
                    >
                        N
                    </kbd>
                </Button>
            </div>
        </header>
    );
}
