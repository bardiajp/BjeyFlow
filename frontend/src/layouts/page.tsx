import type { ReactNode } from 'react';

export default function PageLayout({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex w-full flex-1 flex-col gap-6">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {children}
        </div>
    );
}
