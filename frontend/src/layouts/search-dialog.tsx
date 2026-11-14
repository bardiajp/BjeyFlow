import { ArrowRight, CircleCheck, CornerDownLeft, Loader2, Search, Waves } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { ProjectIcon } from '@/app/projects/components/project-icon';
import { useAppData } from '@/app/tasks/hooks/use-app-data';
import DisplayError from '@/components/display-error';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function SearchDialog({
    open,
    onOpenChange,
    onOpenTask,
    onSearchAll,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOpenTask: (id: string) => void;
    onSearchAll: (query: string) => void;
}) {
    const { tasks } = useAppData();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listId = useId();
    const term = query.trim().toLocaleLowerCase();
    const matches = (tasks.data ?? [])
        .filter((task) => `${task.title} ${task.description}`.toLocaleLowerCase().includes(term))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const results = matches.slice(0, 8);

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
            onOpenChangeComplete={(isOpen) => {
                if (!isOpen) {
                    setQuery('');
                    setActiveIndex(0);
                }
            }}
        >
            <DialogContent
                initialFocus={inputRef}
                className="floating-search ring-primary/20 border-input bg-popover/95 flex max-h-[min(640px,85dvh)] max-w-xl min-w-0 flex-col gap-0 overflow-hidden rounded-[26px] border p-0 shadow-[0_24px_100px_-24px_#02304760] backdrop-blur-2xl"
            >
                <DialogTitle className="sr-only">Search your tasks</DialogTitle>
                <DialogDescription className="sr-only">
                    Search all tasks by title or description. Use the arrow keys to choose a task
                    and Enter to open it.
                </DialogDescription>
                <div className="surface-wash border-primary/15 relative min-w-0 shrink-0 overflow-hidden border-b px-5 pt-5 pb-6">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 600 60"
                        preserveAspectRatio="none"
                        className="text-primary/20 pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full"
                    >
                        <path d="M0 40Q150 0 300 40T600 40V60H0Z" fill="currentColor" />
                        <path d="M0 50Q150 10 300 50T600 50" fill="none" stroke="currentColor" />
                    </svg>
                    <div className="text-primary-foreground/50 relative mb-4 flex items-center gap-2 pr-7 text-[8px] font-semibold tracking-[0.16em]">
                        <Waves size={13} />
                        YOUR SPACE, ONE SEARCH AWAY
                    </div>
                    <div
                        data-slot="field-control"
                        className="focus-within:border-primary/50 focus-within:ring-primary/10 border-input bg-card/75 relative flex min-w-0 items-center gap-3 rounded-2xl border p-2.5 shadow-[0_3px_12px_-8px_#02304730] focus-within:ring-2"
                    >
                        <span className="border-primary/25 bg-primary/20 text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl border">
                            <Search size={20} strokeWidth={1.7} />
                        </span>
                        <input
                            ref={inputRef}
                            role="combobox"
                            aria-label="Search all tasks"
                            aria-autocomplete="list"
                            aria-expanded={results.length > 0}
                            aria-controls={listId}
                            aria-activedescendant={
                                results[activeIndex]
                                    ? `${listId}-${results[activeIndex].id}`
                                    : undefined
                            }
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="Find a little clarity…"
                            value={query}
                            className="text-primary-foreground w-0 min-w-0 flex-1 bg-transparent py-1 text-sm font-normal outline-none placeholder:text-slate-400 sm:text-base"
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setActiveIndex(0);
                            }}
                            onKeyDown={(event) => {
                                if (event.nativeEvent.isComposing) return;
                                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                                    event.preventDefault();
                                    if (!results.length) return;
                                    const next =
                                        (activeIndex +
                                            (event.key === 'ArrowDown' ? 1 : -1) +
                                            results.length) %
                                        results.length;
                                    setActiveIndex(next);
                                    document
                                        .getElementById(`${listId}-${results[next].id}`)
                                        ?.scrollIntoView({ block: 'nearest' });
                                }
                                if (event.key === 'Enter' && results[activeIndex]) {
                                    event.preventDefault();
                                    onOpenTask(results[activeIndex].id);
                                }
                            }}
                        />
                        <kbd
                            aria-hidden="true"
                            className="hidden shrink-0 rounded-md border border-slate-200/70 bg-white px-1.5 py-1 text-[9px] text-slate-400 sm:block"
                        >
                            Ctrl K
                        </kbd>
                    </div>
                </div>
                <div className="min-h-0 min-w-0 flex-1 [scrollbar-width:thin] overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-3">
                    <div className="mb-2 flex min-w-0 items-center justify-between gap-2 px-2 text-[9px] font-semibold tracking-[0.14em] text-slate-400">
                        <span>{term ? 'SEARCH RESULTS' : 'RECENTLY UPDATED'}</span>
                        <span className="shrink-0 rounded-md bg-slate-100/80 px-1.5 py-1 text-[9px] font-normal tracking-normal tabular-nums">
                            {matches.length} tasks
                        </span>
                    </div>
                    {tasks.isPending && (
                        <p
                            role="status"
                            className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400"
                        >
                            <Loader2
                                size={16}
                                className="animate-spin motion-reduce:animate-none"
                            />
                            Finding your flow…
                        </p>
                    )}
                    <DisplayError error={tasks.error} onRetry={() => void tasks.refetch()} />
                    <div
                        id={listId}
                        role="listbox"
                        aria-label="Matching tasks"
                        className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1.5"
                    >
                        {results.map((task, index) => (
                            <button
                                key={task.id}
                                id={`${listId}-${task.id}`}
                                type="button"
                                role="option"
                                aria-selected={activeIndex === index}
                                tabIndex={-1}
                                className={cn(
                                    'flow-control group relative flex w-full max-w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-transparent px-3 py-3 text-left outline-none',
                                    activeIndex === index
                                        ? 'surface-wash border-primary/35 shadow-[0_2px_8px_-5px_#02304725]'
                                        : 'bg-white/60'
                                )}
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => onOpenTask(task.id)}
                            >
                                <span className="text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-white">
                                    {task.status === 'completed' ? (
                                        <CircleCheck size={17} className="text-emerald-600" />
                                    ) : (
                                        <ProjectIcon name={task.project_icon} size={17} />
                                    )}
                                </span>
                                <span className="min-w-0 flex-1 overflow-hidden">
                                    <span className="text-primary-foreground block truncate text-[13px] font-medium">
                                        {task.title}
                                    </span>
                                    <span className="mt-1 block truncate text-[10px] text-slate-400">
                                        {task.project_name}
                                        {task.status === 'completed' ? ' · Completed' : ''}
                                    </span>
                                </span>
                                <CornerDownLeft
                                    size={14}
                                    aria-hidden="true"
                                    className={cn(
                                        'text-primary-foreground/50 shrink-0',
                                        activeIndex !== index && 'opacity-0'
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    {tasks.isSuccess && !results.length && (
                        <div className="grid justify-items-center gap-3 px-5 py-10 text-center">
                            <Search size={25} strokeWidth={1.3} className="text-primary" />
                            <p className="text-primary-foreground text-sm font-medium">
                                {term ? 'No tasks found.' : 'A little breathing room.'}
                            </p>
                            <p className="text-xs text-slate-400">
                                {term
                                    ? 'Try another title or a few different words.'
                                    : 'Your tasks will appear here when you add them.'}
                            </p>
                        </div>
                    )}
                    {term && matches.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onSearchAll(query.trim())}
                            className="flow-control text-primary-foreground border-primary/20 mt-3 flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border bg-white px-3 py-3 text-[11px] font-medium outline-none"
                        >
                            <span className="min-w-0 truncate">
                                View all {matches.length} results in Inbox
                            </span>
                            <ArrowRight size={14} className="shrink-0" />
                        </button>
                    )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 bg-white/70 px-5 py-3 text-[9px] text-slate-400">
                    <span>Less searching. More flow.</span>
                    <span className="flex items-center gap-3">
                        <span>
                            <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5">
                                ↑ ↓
                            </kbd>{' '}
                            navigate
                        </span>
                        <span>
                            <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5">
                                ↵
                            </kbd>{' '}
                            open
                        </span>
                        <span>
                            <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5">
                                esc
                            </kbd>{' '}
                            close
                        </span>
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
}
