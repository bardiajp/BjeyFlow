import { useEffect } from 'react';
import { ArrowRight, Check, Compass, CornerDownRight, MoveUpRight } from 'lucide-react';
import { Link } from 'react-router';
import useUserStore from '@/store/use-user-store';
import { AccentTitle } from '@/components/accent-title';

export default function NotFound() {
    const user = useUserStore((state) => state.user);
    const home = user ? '/today' : '/login';

    useEffect(() => {
        document.title = 'Page not found · BjeyFlow';
    }, []);

    return (
        <div className="surface-wash text-foreground flex min-h-dvh flex-col">
            <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-7 sm:px-10">
                <Link
                    to={home}
                    aria-label="BjeyFlow home"
                    className="rounded-lg text-2xl font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-[#8ecae6]"
                >
                    BjeyFlow<span className="text-secondary">.</span>
                </Link>
                <span className="text-muted-foreground hidden text-xs sm:block">
                    A little more flow. A little less noise.
                </span>
            </header>

            <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:py-20">
                <div className="order-2 max-w-lg lg:order-1">
                    <p className="text-muted-foreground mb-5 flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase">
                        <span className="size-1.5 rounded-full bg-[#b69a38] dark:bg-[#f3d468]" />A
                        small detour · Error 404
                    </p>
                    <h1 className="text-4xl leading-[1.1] font-medium tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                        <AccentTitle>A little off track.</AccentTitle>
                        <br />
                        <span className="text-muted-foreground">
                            <AccentTitle>Still in your flow.</AccentTitle>
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-6 max-w-sm text-sm leading-7 sm:text-base">
                        This page may have moved, or the link took a wrong turn. Let’s get you back
                        to a calmer place.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-5">
                        <Link
                            to={home}
                            className="flow-control inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-transparent bg-[#023047] px-6 text-sm font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-[#8ecae6] focus-visible:ring-offset-2 dark:bg-[#8ecae6] dark:text-[#023047]"
                        >
                            {user ? 'Back to my day' : 'Back to sign in'}
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                        <Link
                            to={user ? '/inbox' : '/signup'}
                            className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 rounded-lg text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#8ecae6]"
                        >
                            {user ? 'Open my inbox' : 'New here? Find your flow'}
                            <MoveUpRight className="size-3.5" aria-hidden="true" />
                        </Link>
                    </div>
                </div>

                <div
                    aria-hidden="true"
                    className="relative order-1 mx-auto flex aspect-[1.15] w-full max-w-md items-center justify-center lg:order-2"
                >
                    <div className="absolute inset-[8%] rounded-full border border-[#8ecae6]/20" />
                    <div className="absolute inset-[18%] rounded-full border border-dashed border-[#8ecae6]/30" />
                    <div className="absolute inset-[28%] rounded-full bg-[#8ecae6]/10" />
                    <svg
                        viewBox="0 0 440 380"
                        className="absolute inset-0 size-full text-[#8ecae6]"
                        fill="none"
                    >
                        <path
                            d="M38 270C100 320 142 295 136 245S83 174 125 123 239 103 270 157 306 278 396 217"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="5 9"
                            strokeLinecap="round"
                        />
                        <circle cx="38" cy="270" r="5" fill="currentColor" />
                        <circle cx="396" cy="217" r="5" fill="currentColor" />
                    </svg>
                    <span className="relative text-[clamp(7rem,22vw,11rem)] leading-none font-medium tracking-[-0.09em] text-[#023047] dark:text-[#c7e7f5]">
                        4<span className="text-[#8ecae6]">0</span>4
                    </span>
                    <div className="bg-card absolute top-[10%] right-[1%] flex -rotate-6 items-center gap-3 rounded-2xl border border-[#8ecae6]/25 px-4 py-3 shadow-[0_12px_36px_-18px_#02304740]">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-[#8ecae6]/15 text-[#548aa3] dark:text-[#8ecae6]">
                            <Compass className="size-4" />
                        </span>
                        <div>
                            <p className="text-foreground text-xs font-medium">Finding your way</p>
                            <p className="text-muted-foreground mt-0.5 text-[10px]">
                                One small step at a time
                            </p>
                        </div>
                    </div>
                    <div className="bg-card absolute bottom-[8%] left-[1%] flex rotate-3 items-center gap-3 rounded-2xl border border-[#8ecae6]/25 px-4 py-3 shadow-[0_12px_36px_-18px_#02304740]">
                        <span className="flex size-7 items-center justify-center rounded-full bg-[#f3d468]/25 text-[#8d762c] dark:text-[#f3d468]">
                            <Check className="size-3.5" />
                        </span>
                        <span className="text-foreground text-xs font-medium">
                            Your tasks are right where you left them.
                        </span>
                    </div>
                    <CornerDownRight className="absolute top-[8%] left-[12%] size-7 rotate-12 text-[#b69a38] dark:text-[#f3d468]" />
                </div>
            </main>

            <footer className="text-muted-foreground mx-auto w-full max-w-6xl px-6 py-7 text-xs sm:px-10">
                Less noise. More focus.
            </footer>
        </div>
    );
}
