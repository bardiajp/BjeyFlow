import { ArrowRight, CloudOff, RefreshCw, Waves } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router';
import useUserStore from '@/store/use-user-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AccentTitle } from '@/components/accent-title';

export default function ErrorState({
    kind,
    onRetry,
    fullPage = false,
}: {
    kind: 'offline' | 'connection' | 'server' | 'unexpected';
    onRetry: () => void;
    fullPage?: boolean;
}) {
    const user = useUserStore((state) => state.user);
    const titleId = useId();
    const connection = kind === 'offline' || kind === 'connection';
    const title =
        kind === 'offline'
            ? 'A moment to reconnect.'
            : connection
              ? 'Your flow is a little out of reach.'
              : 'A small pause in the flow.';
    const description =
        kind === 'offline'
            ? 'You’re offline right now. Check your connection and we’ll bring your space back when you’re connected.'
            : connection
              ? 'We couldn’t reach BjeyFlow. Check your connection or try again in a moment.'
              : 'Something on our side needs a little attention. Please try again in a moment.';
    const Icon = connection ? CloudOff : Waves;

    return (
        <section
            role="alert"
            aria-labelledby={titleId}
            className={cn(
                'surface-wash text-foreground flex flex-col items-center justify-center px-6 py-14 text-center',
                fullPage ? 'min-h-dvh' : 'border-input min-h-80 rounded-3xl border'
            )}
        >
            {fullPage && (
                <Link
                    to={user ? '/today' : '/login'}
                    className="mb-12 rounded-lg text-2xl font-semibold tracking-tight focus-visible:ring-2"
                >
                    BjeyFlow<span className="text-secondary">.</span>
                </Link>
            )}
            <div
                aria-hidden="true"
                className="relative mb-8 flex size-32 items-center justify-center rounded-full border border-dashed border-[#8ecae6]/50"
            >
                <div className="absolute inset-3 rounded-full bg-[#8ecae6]/15" />
                <Icon
                    className="relative size-12 text-[#548aa3] dark:text-[#8ecae6]"
                    strokeWidth={1.3}
                />
                <span className="absolute top-2 right-3 size-3 rounded-full bg-[#f3d468]" />
            </div>
            <p className="text-muted-foreground mb-3 text-[10px] font-medium tracking-[0.18em] uppercase">
                {connection
                    ? 'Let’s find our connection'
                    : kind === 'server'
                      ? 'Server error'
                      : 'A little unexpected'}
            </p>
            <h1
                id={titleId}
                className="max-w-xl text-3xl leading-tight font-medium tracking-tight sm:text-4xl"
            >
                <AccentTitle>{title}</AccentTitle>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-md text-sm leading-7">{description}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button
                    onClick={onRetry}
                    className="bg-brand min-h-11 gap-2 rounded-xl px-5 text-white"
                >
                    <RefreshCw size={15} /> Try again
                </Button>
                <Link
                    to={user ? '/today' : '/login'}
                    className="text-muted-foreground inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm hover:underline focus-visible:ring-2"
                >
                    Back to your space <ArrowRight size={14} />
                </Link>
            </div>
        </section>
    );
}
