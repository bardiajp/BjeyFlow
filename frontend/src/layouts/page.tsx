import type { ReactNode } from 'react';
import { AccentTitle } from '@/components/accent-title';

export default function PageLayout({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex w-full flex-1 flex-col gap-6">
            <h1 className="text-2xl font-semibold tracking-tight">
                <AccentTitle>{title}</AccentTitle>
            </h1>
            {children}
        </div>
    );
}
