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
import { Link } from 'react-router';
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

export default function SettingsPage() {
    const user = useUserStore((state) => state.user);
    const preferences = usePreferences();
    const { setPreference } = preferences;
    const name = user?.display_name || user?.username || 'Your account';
    return (
        <div className="flex min-h-full w-full min-w-0 flex-1 flex-col gap-6">
            <header className="surface-wash border-input relative overflow-hidden rounded-[24px] border p-5 sm:p-6">
                <div className="text-muted-foreground mb-5 flex items-center gap-2 text-[9px] font-semibold tracking-[0.16em]">
                    <Waves size={15} />
                    YOUR PERSONAL CURRENT
                </div>
                <h1 className="text-foreground text-[30px] font-semibold tracking-[-0.04em]">
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
            <div className="min-w-0 columns-1 gap-5 lg:columns-2 2xl:columns-3 [&>section]:mb-5 [&>section]:break-inside-avoid">
                <section className="border-input bg-card rounded-[22px] border p-5">
                    <div className="text-muted-foreground mb-5 flex items-center gap-2 text-[10px] font-semibold tracking-[0.1em]">
                        <UserRound size={14} />
                        YOUR ACCOUNT
                    </div>
                    <span className="bg-brand text-primary mb-4 flex size-14 items-center justify-center rounded-2xl text-lg font-medium">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt=""
                                className="size-full rounded-2xl object-cover"
                            />
                        ) : (
                            name.slice(0, 1).toUpperCase()
                        )}
                    </span>
                    <h2 className="text-foreground text-lg font-medium tracking-tight break-words">
                        <AccentTitle trailingDot={false}>{name}</AccentTitle>
                    </h2>
                    <p className="text-muted-foreground mt-1 text-xs break-words">
                        @{user?.username}
                    </p>
                    {user?.email && (
                        <p className="text-muted-foreground mt-2 text-[10px] break-all">
                            {user.email}
                        </p>
                    )}
                    {user?.flow_name && (
                        <p className="text-foreground mt-4 text-[11px] font-medium">
                            {user.flow_name}
                        </p>
                    )}
                    {user?.north_star && (
                        <div className="border-input bg-background mt-3 rounded-xl border p-3">
                            <p className="text-muted-foreground text-[8px] font-semibold tracking-[0.1em]">
                                YOUR NORTH STAR
                            </p>
                            <p className="text-foreground mt-2 text-[11px] leading-relaxed break-words">
                                {user.north_star}
                            </p>
                        </div>
                    )}
                    <span className="bg-accent text-muted-foreground mt-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px]">
                        <Shield size={12} />
                        {user?.role === 'superuser'
                            ? 'System administrator'
                            : user?.role === 'staff'
                              ? 'Staff'
                              : 'Personal account'}
                    </span>
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
                <ProfileSettings />
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
                <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
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
                                ].map((option) => ({ ...option, icon: <Bell size={15} /> }))}
                            />
                        </div>
                    </div>
                </section>
                <TaskPreferences />
                <DatePreferences />
                <NotificationSettings />
                <SessionSettings />
                <section className="border-input bg-card flex flex-wrap items-center justify-between gap-3 rounded-[22px] border p-5 sm:p-6">
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
            </div>
        </div>
    );
}
