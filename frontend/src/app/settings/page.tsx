import {
    Bell,
    CalendarDays,
    Check,
    Columns3,
    List,
    LockKeyhole,
    Monitor,
    Moon,
    RotateCcw,
    Shield,
    SlidersHorizontal,
    Sun,
    Timer,
    UserRound,
    Waves,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { AccentTitle } from '@/components/accent-title';
import ChangePassword from '@/app/users/components/change-password';
import { LabeledSelect } from '@/components/form/labeled-select';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/store/use-preferences';
import useUserStore from '@/store/use-user-store';
import { PreferenceToggle } from './preference-toggle';
import { ProfileSettings } from './profile';
import { SessionSettings } from './sessions';
import { TaskPreferences, DatePreferences } from './task-preferences';
import { NotificationSettings } from './notifications';
import { DesktopSettings } from './desktop';
import { UsernameSettings } from './username';
import { DeleteAccount } from './delete-account';
import { RecommendationSettings } from './recommendations';

function SettingsGroup({
    id,
    title,
    description,
    children,
}: {
    id: string;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section
            id={id}
            className="border-input bg-card min-w-0 scroll-mt-6 rounded-[22px] border p-5 sm:p-6"
        >
            <div className="border-input mb-5 border-b pb-4">
                <h2 className="text-foreground text-base font-semibold tracking-tight">{title}</h2>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p>
            </div>
            <div className="[&>section+section]:border-input grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 [&>section]:min-w-0 [&>section]:max-w-full [&>section]:rounded-none [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0 [&>section+section]:border-t [&>section+section]:pt-5">
                {children}
            </div>
        </section>
    );
}

export default function SettingsPage() {
    const user = useUserStore((state) => state.user);
    const preferences = usePreferences();
    const { setPreference } = preferences;
    const name = user?.display_name || user?.username || 'Your account';
    const location = useLocation();
    useEffect(() => {
        if (location.hash === '#notifications')
            document.getElementById('notifications')?.scrollIntoView();
    }, [location.hash]);
    return (
        <div className="flex min-h-full w-full min-w-0 flex-1 flex-col gap-4 sm:gap-6">
            <header className="surface-wash border-input relative overflow-hidden rounded-2xl border p-4 sm:rounded-[24px] sm:p-6">
                <div className="text-muted-foreground mb-5 flex items-center gap-2 text-[9px] font-semibold tracking-[0.16em]">
                    <Waves size={15} />
                    YOUR PERSONAL CURRENT
                </div>
                <h1 className="text-foreground text-[23px] font-semibold tracking-[-0.04em] sm:text-[30px]">
                    <AccentTitle>Make yourself at home</AccentTitle>
                </h1>
                <p className="text-muted-foreground mt-3 text-sm">
                    Your account, your rhythm, your own little flow.
                </p>
                <span className="border-input bg-card/80 text-muted-foreground mt-5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[9px]">
                    <Check size={11} />
                    {preferences.syncError
                        ? 'Saved on this browser · account sync failed'
                        : preferences.syncing || Object.keys(preferences.pending).length
                          ? 'Saving to your account…'
                          : 'Preferences sync with your account'}
                </span>
            </header>
            {preferences.syncError && (
                <div
                    role="alert"
                    className="border-destructive/30 bg-destructive/5 rounded-2xl border p-4"
                >
                    <p className="text-destructive text-xs">{preferences.syncError}</p>
                    <Button
                        variant="outline"
                        className="mt-3 h-9 rounded-xl text-xs"
                        onClick={() => usePreferences.setState({ syncError: null })}
                    >
                        Retry account sync
                    </Button>
                </div>
            )}
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-2">
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5">
                    <SettingsGroup
                        id="settings-account"
                        title="Account & security"
                        description="Your profile, password and signed-in devices."
                    >
                        <section className="border-input bg-card rounded-[22px] border p-5">
                            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <span className="bg-accent text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                                        <UserRound size={18} />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-foreground text-sm font-semibold break-words">
                                            {name}
                                        </h2>
                                        <p className="text-muted-foreground mt-1 text-xs break-words">
                                            @{user?.username}
                                        </p>
                                        {user?.email && (
                                            <p className="text-muted-foreground mt-1 text-[11px] break-all">
                                                {user.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className="bg-accent text-muted-foreground inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[10px]">
                                    <Shield size={12} />
                                    {user?.role === 'superuser'
                                        ? 'System administrator'
                                        : user?.role === 'staff'
                                          ? 'Staff'
                                          : 'Personal account'}
                                </span>
                            </div>
                            {user && user.role !== 'user' && (
                                <Link
                                    to="/admin"
                                    className="flow-control border-input text-foreground mt-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs"
                                >
                                    <SlidersHorizontal size={14} />
                                    Manage users
                                </Link>
                            )}
                        </section>
                        <ProfileSettings />
                        <UsernameSettings />
                        <section className="border-input bg-card rounded-[22px] border p-5">
                            <h2 className="text-foreground mb-2 flex items-center gap-2 text-[13px] font-medium">
                                <LockKeyhole size={15} />
                                Keep your space safe
                            </h2>
                            <p className="text-muted-foreground mb-4 text-[11px] leading-relaxed">
                                Manage your password and keep your account secure.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <ChangePassword />
                            </div>
                        </section>
                        <SessionSettings />
                        <DeleteAccount />
                    </SettingsGroup>
                    <SettingsGroup
                        id="settings-notifications"
                        title="Notifications"
                        description="Choose how and when BjeyFlow keeps you updated."
                    >
                        <NotificationSettings />
                    </SettingsGroup>
                    <SettingsGroup
                        id="settings-recommendations"
                        title="Your ideas"
                        description="Help shape a more useful BjeyFlow."
                    >
                        <RecommendationSettings />
                    </SettingsGroup>
                </div>
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:gap-5">
                    <SettingsGroup
                        id="settings-appearance"
                        title="Preferences"
                        description="Personalize your appearance, tasks and daily rhythm."
                    >
                        <section
                            id="appearance"
                            className="border-input bg-card rounded-[22px] border p-5 sm:p-6"
                        >
                            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                                <Sun size={16} />A change of atmosphere
                            </h2>
                            <p className="text-muted-foreground mt-2 mb-5 text-[11px]">
                                Same calm waters. A different light.
                            </p>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {(
                                    [
                                        { value: 'light', label: 'Daylight', icon: Sun },
                                        { value: 'dark', label: 'Deep sea', icon: Moon },
                                        { value: 'system', label: 'System', icon: Monitor },
                                    ] as const
                                ).map(({ value, label, icon: Icon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        aria-pressed={preferences.theme === value}
                                        onClick={() => setPreference('theme', value)}
                                        className={cn(
                                            'flow-control border-input bg-background text-muted-foreground relative grid justify-items-center gap-3 rounded-2xl border p-4 text-xs',
                                            preferences.theme === value &&
                                                'border-primary text-foreground ring-primary/30 ring-1'
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex size-10 items-center justify-center rounded-xl',
                                                value === 'dark'
                                                    ? 'bg-[#142c3a] text-[#8ecae6]'
                                                    : 'bg-accent text-foreground'
                                            )}
                                        >
                                            <Icon size={19} strokeWidth={1.5} />
                                        </span>
                                        {label}
                                        {preferences.theme === value && (
                                            <Check
                                                size={12}
                                                className="text-primary absolute top-2 right-2"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>
                        <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
                            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                                <Waves size={16} />
                                Set the water in motion
                            </h2>
                            <div className="divide-input mt-2 divide-y">
                                <PreferenceToggle
                                    label="Living water"
                                    description="Let the top bar waves flow and respond to your cursor."
                                    checked={preferences.waterEffects}
                                    onChange={(value) => setPreference('waterEffects', value)}
                                />
                                <PreferenceToggle
                                    label="A little splash"
                                    description="Scatter water droplets when you click the top bar."
                                    checked={preferences.clickSplash}
                                    disabled={!preferences.waterEffects}
                                    onChange={(value) => setPreference('clickSplash', value)}
                                />
                            </div>
                        </section>
                        <section
                            id="settings-workflow"
                            className="border-input bg-card rounded-[22px] border p-5 sm:p-6"
                        >
                            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                                <Timer size={16} />
                                Find your own rhythm
                            </h2>
                            <p className="text-muted-foreground mt-2 mb-5 text-[11px]">
                                A few little defaults to make each day feel like yours.
                            </p>
                            <div className="grid gap-5">
                                <LabeledSelect
                                    label="Default task view"
                                    value={preferences.defaultView}
                                    onValueChange={(value) =>
                                        setPreference(
                                            'defaultView',
                                            value as typeof preferences.defaultView
                                        )
                                    }
                                    options={[
                                        { value: 'list', label: 'List', icon: <List size={15} /> },
                                        {
                                            value: 'board',
                                            label: 'Board',
                                            icon: <Columns3 size={15} />,
                                        },
                                        {
                                            value: 'calendar',
                                            label: 'Tide calendar',
                                            icon: <CalendarDays size={15} />,
                                        },
                                    ]}
                                />
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <LabeledSelect
                                        label="Focus duration"
                                        value={String(preferences.focusMinutes)}
                                        onValueChange={(value) =>
                                            setPreference('focusMinutes', Number(value))
                                        }
                                        options={[15, 25, 50, 90].map((value) => ({
                                            value: String(value),
                                            label: `${value} minutes`,
                                            icon: <Timer size={15} />,
                                        }))}
                                    />
                                    <LabeledSelect
                                        label="Toast duration"
                                        value={String(preferences.toastDuration)}
                                        onValueChange={(value) =>
                                            setPreference('toastDuration', Number(value))
                                        }
                                        options={[
                                            { value: '3000', label: 'Brief · 3 seconds' },
                                            { value: '5000', label: 'Balanced · 5 seconds' },
                                            { value: '8000', label: 'Unhurried · 8 seconds' },
                                        ].map((option) => ({
                                            ...option,
                                            icon: <Bell size={15} />,
                                        }))}
                                    />
                                </div>
                            </div>
                        </section>
                        <TaskPreferences />
                        <DatePreferences />
                        <section className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-muted-foreground text-[10px]">
                                Defaults apply the next time a view or session opens.
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                className="border-input gap-2 rounded-xl border text-[11px]"
                                onClick={() => {
                                    preferences.resetPreferences();
                                    toast.add({
                                        type: 'info',
                                        title: 'A fresh start',
                                        description: 'Your preferences are back to their defaults.',
                                    });
                                }}
                            >
                                <RotateCcw size={13} />
                                Reset preferences
                            </Button>
                        </section>
                    </SettingsGroup>
                    <SettingsGroup
                        id="settings-downloads"
                        title="Apps & downloads"
                        description="Take BjeyFlow with you on desktop and Android."
                    >
                        <DesktopSettings />
                    </SettingsGroup>
                </div>
            </div>
        </div>
    );
}
