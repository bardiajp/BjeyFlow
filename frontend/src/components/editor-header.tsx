import type { ReactNode } from 'react';
import { Waves, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { AccentTitle } from '@/components/accent-title';

export function EditorHeader({
    title,
    description,
    icon,
    onClose,
    disabled = false,
}: {
    title: string;
    description: string;
    icon: ReactNode;
    onClose: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="surface-wash border-primary/20 relative -mx-6 -mt-6 mb-6 overflow-hidden border-b px-6 pt-6 pb-8 sm:-mx-8 sm:-mt-8 sm:px-8 sm:pt-8">
            <svg
                aria-hidden="true"
                viewBox="0 0 600 100"
                preserveAspectRatio="none"
                className="text-primary pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full"
            >
                <path d="M0 65Q150 5 300 65T600 65V100H0Z" fill="currentColor" fillOpacity="0.16" />
                <path
                    d="M0 80Q150 30 300 80T600 80"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.35"
                />
            </svg>
            <div className="relative mb-6 flex items-center justify-between">
                <span className="text-primary-foreground/60 flex items-center gap-2 text-[9px] font-semibold tracking-[0.18em]">
                    <Waves size={15} />A LITTLE MORE FLOW
                </span>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClose}
                    disabled={disabled}
                    aria-label="Close editor"
                    className="text-primary-foreground size-8 rounded-xl border border-white/80 bg-white/60"
                >
                    <X size={16} />
                </Button>
            </div>
            <div className="relative flex items-start gap-4">
                <span className="text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white bg-white/65 shadow-[0_3px_12px_-6px_#02304730]">
                    {icon}
                </span>
                <div className="min-w-0">
                    <DrawerTitle className="text-primary-foreground text-[27px] leading-tight font-semibold tracking-[-0.04em] break-words">
                        <AccentTitle>{title}</AccentTitle>
                    </DrawerTitle>
                    <DrawerDescription className="mt-2 text-xs leading-relaxed text-slate-500">
                        {description}
                    </DrawerDescription>
                </div>
            </div>
        </div>
    );
}
