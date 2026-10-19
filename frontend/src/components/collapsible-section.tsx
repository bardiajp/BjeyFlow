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
                className="flex items-center gap-2 py-4 text-sm font-semibold"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen(!open)}
            >
                <ChevronDown
                    size={16}
                    className={cn('transition-transform', !open && '-rotate-90')}
                />
                <span>{title}</span>
                <span className="ml-1 font-normal text-neutral-500">{count}</span>
            </button>
            <div id={id} hidden={!open}>
                {children}
            </div>
        </section>
    );
}
