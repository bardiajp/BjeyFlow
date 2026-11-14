import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CollapsibleSection({
    title,
    count,
    children,
    defaultOpen = true,
}: {
    title: string;
    count: number;
    children: ReactNode;
    defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const id = useId();
    return (
        <section>
            <button
                type="button"
                className="text-primary-foreground focus-visible:ring-primary flex items-center gap-2 rounded-lg px-2 py-3 text-xs font-semibold outline-none hover:text-slate-500 focus-visible:ring-2"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen(!open)}
            >
                <ChevronDown
                    size={16}
                    className={cn('transition-transform', !open && '-rotate-90')}
                />
                <span>{title}</span>
                <span className="ml-1 min-w-5 rounded-md bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-medium text-slate-400">
                    {count}
                </span>
            </button>
            <div id={id} hidden={!open}>
                {children}
            </div>
        </section>
    );
}
