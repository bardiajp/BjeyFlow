import { useEffect } from 'react';
import { CircleHelp, Monitor, Moon, ShieldCheck, Sun } from 'lucide-react';
import './login.css';
import LoginForm from './components/login-form';
import SignupForm from './components/signup-form';
import AccountHelp from './components/account-help';
import ballIcon from '@/assets/ball.svg';
import { PageTransition } from '@/components/page-transition';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/store/use-preferences';

export default function Login({ signup = false }: { signup?: boolean }) {
    const theme = usePreferences((state) => state.theme);
    const setPreference = usePreferences((state) => state.setPreference);
    const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
    useEffect(() => {
        const previousTitle = document.title;
        document.title = `${signup ? 'Create your account' : 'Sign in'} · BjeyFlow`;
        return () => {
            document.title = previousTitle;
        };
    }, [signup]);

    return (
        <PageTransition waitForAssets>
            <div className="bg-workspace grid min-h-dvh gap-4 p-4 sm:gap-5 sm:p-5 lg:grid-cols-2">
                <aside
                    className="border-input relative h-[28svh] min-h-40 overflow-hidden rounded-[28px] border lg:sticky lg:top-5 lg:h-[calc(100dvh-2.5rem)]"
                    aria-label="BjeyFlow artwork"
                >
                    <img
                        src="/images/login.png"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </aside>
                <section className="bg-card border-input flex min-w-0 flex-col rounded-[28px] border px-6 py-6 sm:px-10 lg:min-h-[calc(100dvh-2.5rem)] xl:px-16">
                    <header className="flex w-full items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-11 items-center justify-center">
                                <img src={ballIcon} alt="" className="size-8" />
                            </span>
                            <span className="text-foreground text-[22px] font-semibold tracking-tight">
                                BjeyFlow<span className="text-secondary">.</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AccountHelp className="flow-control text-muted-foreground flex h-9 items-center gap-2 rounded-xl border border-transparent px-3 text-[11px]">
                                <CircleHelp size={15} />
                                <span className="hidden sm:inline">A little help?</span>
                            </AccountHelp>
                            <Button
                                type="button"
                                variant="outline"
                                aria-label={`Theme: ${theme}. Switch appearance`}
                                title={`Appearance: ${theme}`}
                                className="size-9 rounded-xl p-0"
                                onClick={() =>
                                    setPreference(
                                        'theme',
                                        theme === 'system'
                                            ? 'light'
                                            : theme === 'light'
                                              ? 'dark'
                                              : 'system'
                                    )
                                }
                            >
                                <ThemeIcon size={16} />
                            </Button>
                        </div>
                    </header>
                    <main className="flex min-w-0 flex-1 items-center justify-center py-12 lg:py-10">
                        {signup ? <SignupForm /> : <LoginForm />}
                    </main>
                    <footer className="text-muted-foreground flex w-full flex-wrap items-center justify-between gap-3 text-[10px]">
                        <span>© {new Date().getFullYear()} BjeyFlow · A little every day.</span>
                        <div className="flex items-center gap-4">
                            <span className="hidden items-center gap-1.5 sm:flex">
                                <ShieldCheck size={12} />
                                Your space stays yours.
                            </span>
                            <AccountHelp
                                topic="privacy"
                                className="focus-visible:ring-primary rounded outline-none hover:underline focus-visible:ring-2"
                            >
                                Privacy
                            </AccountHelp>
                        </div>
                    </footer>
                </section>
            </div>
        </PageTransition>
    );
}
