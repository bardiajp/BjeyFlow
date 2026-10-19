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
        <div className="relative w-full sm:w-64 xl:w-72">
            <Search
                size={17}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                strokeWidth={1.5}
            />
            <Input
                ref={inputRef}
                type="search"
                aria-label="Search tasks"
                placeholder="Search tasks…"
                className="h-10 rounded-xl border-muted pr-3 pl-10 text-sm font-normal md:pr-20"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') onSubmit();
                }}
            />
            <kbd
                className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 text-[10px] text-muted md:block"
                aria-hidden="true"
            >
                Ctrl K
            </kbd>
        </div>
    );
}
