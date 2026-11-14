import { Search } from 'lucide-react';
import type { RefObject } from 'react';
import { Input } from './ui/input';

export function SearchInput({
    value,
    onChange,
    inputRef,
    onSubmit,
}: {
    value: string;
    onChange: (value: string) => void;
    inputRef: RefObject<HTMLInputElement | null>;
    onSubmit: () => void;
}) {
    return (
        <div className="group/search relative w-full lg:w-52 xl:w-64 2xl:w-72">
            <Search
                size={17}
                className="group-focus-within/search:text-primary-foreground group-hover/search:text-primary-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400 transition-colors"
                strokeWidth={1.5}
            />
            <Input
                ref={inputRef}
                type="search"
                aria-label="Search tasks"
                placeholder="Search tasks…"
                className="flow-control focus-visible:border-primary focus-visible:ring-primary/20 h-11 rounded-xl border-slate-200/70 bg-white/75 pr-3 pl-10 text-[12px] font-normal shadow-[inset_0_1px_3px_#02304704] placeholder:text-slate-400 focus:bg-white md:pr-20"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') onSubmit();
                }}
            />
            <kbd
                className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 md:block"
                aria-hidden="true"
            >
                Ctrl K
            </kbd>
        </div>
    );
}
