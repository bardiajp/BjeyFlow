import {
    Activity,
    BellRing,
    ChartNoAxesCombined,
    CircleAlert,
    FileCode2,
    Mail,
    Server,
    Settings2,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { NavLink, useLocation, useOutlet } from 'react-router';
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AccentTitle } from '@/components/accent-title';
import { cn } from '@/lib/utils';
import useUserStore from '@/store/use-user-store';

const tabs = [
    { to: '/admin', label: 'Overview', icon: ChartNoAxesCombined },
    { to: '/admin/users', label: 'People', icon: Users },
    { to: '/admin/activity', label: 'Activity', icon: Activity },
    { to: '/admin/services', label: 'Services', icon: Server },
    { to: '/admin/emails', label: 'Email', icon: Mail },
    { to: '/admin/email-templates', label: 'Email templates', icon: FileCode2 },
    { to: '/admin/notification-templates', label: 'Notification templates', icon: BellRing },
    { to: '/admin/errors', label: 'Errors', icon: CircleAlert },
    { to: '/admin/settings', label: 'Settings', icon: Settings2 },
];

const slideVariants = {
    enter: (offset: number) => ({ opacity: 0, x: offset }),
    visible: { opacity: 1, x: 0 },
    exit: (offset: number) => ({ opacity: 0, x: -offset }),
};

export default function AdminLayout() {
    const user = useUserStore((state) => state.user);
    const location = useLocation();
    const outlet = useOutlet();
    const reduceMotion = useReducedMotion();
    const activeIndex = tabs.findIndex((tab) => tab.to === location.pathname);
    const [slide, setSlide] = useState({ index: activeIndex, direction: 1 });
    if (slide.index !== activeIndex) {
        setSlide({ index: activeIndex, direction: activeIndex > slide.index ? 1 : -1 });
    }
    const offset = reduceMotion ? 0 : slide.direction * 24;
    return (
        <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
            <header className="surface-hero border-input rounded-3xl border p-6 sm:p-8">
                <p className="text-muted-foreground mb-4 flex items-center gap-2 text-[10px] tracking-[0.14em] uppercase">
                    <ShieldCheck size={16} /> A thoughtful space to look after your workspace
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
                            <AccentTitle>Keep the whole flow in view</AccentTitle>
                        </h1>
                        <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-7">
                            People, service health, and the little details that keep everything
                            running calmly.
                        </p>
                    </div>
                    <span className="border-input bg-card/70 text-primary-foreground rounded-full border px-3 py-2 text-xs">
                        {user?.role === 'superuser' ? 'System administrator' : 'Administrator'}
                    </span>
                </div>
            </header>
            <nav
                aria-label="Administration"
                className="border-input bg-card flex flex-wrap gap-1 rounded-2xl border p-2"
            >
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.to === '/admin'}
                        className={({ isActive }) =>
                            cn(
                                'flow-control relative isolate flex min-h-10 items-center gap-2 rounded-xl border border-transparent px-3 text-xs outline-none focus-visible:ring-2',
                                isActive ? 'text-white' : 'text-muted-foreground hover:bg-accent'
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <motion.span
                                        aria-hidden="true"
                                        layoutId="administration-active-tab"
                                        className="bg-brand absolute inset-0 -z-10 rounded-xl"
                                        transition={
                                            reduceMotion
                                                ? { duration: 0 }
                                                : { type: 'spring', stiffness: 450, damping: 36 }
                                        }
                                    />
                                )}
                                <tab.icon size={15} />
                                {tab.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
            <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-clip">
                <AnimatePresence initial={false} mode="wait" custom={offset}>
                    <motion.div
                        key={location.pathname}
                        custom={offset}
                        variants={slideVariants}
                        initial="enter"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="flex min-h-0 w-full flex-1 flex-col"
                    >
                        {outlet}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
