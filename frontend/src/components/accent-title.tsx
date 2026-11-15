export function AccentTitle({
    children,
    trailingDot = true,
}: {
    children: string;
    trailingDot?: boolean;
}) {
    const title = trailingDot && !children.endsWith('.') ? `${children}.` : children;
    return (
        <>
            {title.split(/(\.)/).map((part, index) =>
                part === '.' ? (
                    <span key={index} className="text-secondary">
                        .
                    </span>
                ) : (
                    part
                )
            )}
        </>
    );
}
