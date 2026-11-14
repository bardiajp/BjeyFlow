export function AccentTitle({ children }: { children: string }) {
    return (
        <>
            {children.replace(/\.+$/, '')}
            <span className="text-secondary">.</span>
        </>
    );
}
