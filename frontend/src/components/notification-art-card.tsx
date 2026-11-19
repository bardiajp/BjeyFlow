import { cn } from '@/lib/utils';

export function NotificationArtCard({
    title,
    body,
    image,
    className,
    theme = 'auto',
}: {
    title: string;
    body: string;
    image: string;
    className?: string;
    theme?: 'auto' | 'light' | 'dark';
}) {
    const lightImage = image.replace(/\.(webp|png)(?=\?|$)/, '-light.$1');
    return (
        <div
            className={cn(
                'relative isolate flex min-h-40 overflow-hidden rounded-2xl',
                theme === 'auto' && 'bg-[#edf6fa] text-[#183746] dark:bg-[#073652] dark:text-white',
                theme === 'light' && 'bg-[#edf6fa] text-[#183746]',
                theme === 'dark' && 'bg-[#073652] text-white',
                className
            )}
        >
            <img
                src={lightImage}
                alt=""
                className={cn(
                    'absolute inset-0 -z-10 size-full object-cover object-right',
                    theme === 'dark' ? 'hidden' : theme === 'auto' && 'dark:hidden'
                )}
            />
            <img
                src={image}
                alt=""
                className={cn(
                    'absolute inset-0 -z-10 size-full object-cover object-right',
                    theme === 'light' ? 'hidden' : theme === 'auto' && 'hidden dark:block'
                )}
            />
            <div
                className={cn(
                    'absolute inset-0 -z-10 bg-gradient-to-r',
                    theme === 'dark'
                        ? 'from-[#073652] via-[#073652]/80'
                        : theme === 'light'
                          ? 'from-[#edf6fa] via-[#edf6fa]/80'
                          : 'from-[#edf6fa] via-[#edf6fa]/80 dark:from-[#073652] dark:via-[#073652]/80',
                    'to-transparent'
                )}
            />
            <div className="flex w-[62%] min-w-0 flex-col justify-center p-4 sm:p-5">
                <div
                    className={cn(
                        'mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-wide',
                        theme === 'dark'
                            ? 'text-[#b8e5f2]'
                            : theme === 'light'
                              ? 'text-[#487989]'
                              : 'text-[#487989] dark:text-[#b8e5f2]'
                    )}
                >
                    <img src="/images/ball.svg" alt="" className="size-5" />
                    BJEYFLOW
                </div>
                <p className="text-sm leading-snug font-bold wrap-anywhere">{title}</p>
                <p
                    className={cn(
                        'mt-1 text-xs leading-relaxed wrap-anywhere',
                        theme === 'dark'
                            ? 'text-[#e0f3f8]'
                            : theme === 'light'
                              ? 'text-[#487989]'
                              : 'text-[#487989] dark:text-[#e0f3f8]'
                    )}
                >
                    {body}
                </p>
            </div>
        </div>
    );
}
