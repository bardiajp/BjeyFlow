export default function PageLayout({
    children,
    title,
}: {
    children: React.ReactNode;
    title: string;
}) {
    return (
        <div className="flex flex-col gap-6 w-full flex-1">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            </div>
            {children}
        </div>
    );
}
