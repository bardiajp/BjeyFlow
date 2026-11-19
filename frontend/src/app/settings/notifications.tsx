import { BellOff, Check, Clock3, Smartphone, Sparkles } from 'lucide-react';
import { usePreferences } from '@/store/use-preferences';
import { PreferenceToggle } from './preference-toggle';
import { LabeledSelect } from '@/components/form/labeled-select';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import DisplayError from '@/components/display-error';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function NotificationSettings() {
    const preferences = usePreferences();
    const push = usePushNotifications();
    const checking = push.supported && (push.config.isPending || push.devices.isPending);
    const status = checking
        ? 'Checking things for you'
        : push.permission === 'denied'
          ? 'A little help needed'
          : push.enabled
            ? 'This device is all set!'
            : 'Let’s get you connected';
    return (
        <section
            id="notifications"
            className="border-input bg-card scroll-mt-32 rounded-[22px] border p-5 sm:p-6"
        >
            <div className="bg-primary/5 relative overflow-hidden rounded-2xl px-5 py-6 text-center">
                <Sparkles
                    className="text-primary/40 absolute top-5 left-[20%]"
                    size={17}
                    aria-hidden="true"
                />
                <Sparkles
                    className="text-primary/40 absolute right-[20%] bottom-12"
                    size={13}
                    aria-hidden="true"
                />
                <div className="relative mx-auto size-24" aria-hidden="true">
                    <img src="/images/ball.svg" alt="" className="size-full" />
                    <svg className="absolute inset-0 size-full" viewBox="0 0 112 112" fill="none">
                        <ellipse cx="45" cy="60" rx="3" ry="4" fill="#073B60" />
                        <ellipse cx="67" cy="60" rx="3" ry="4" fill="#073B60" />
                        <path
                            d="M50 69c3 4 9 4 12 0"
                            stroke="#073B60"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <circle cx="87" cy="28" r="15" fill="#FFDD7D" />
                        <path
                            d="M87 19v2m-7 12h14l-2-3v-3a5 5 0 0 0-10 0v3l-2 3Zm5 3a2 2 0 0 0 4 0"
                            stroke="#8B6524"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <h2 className="text-foreground mt-2 text-base font-bold">Stay in your flow!</h2>
                <p className="text-muted-foreground mx-auto mt-1 max-w-xs text-xs leading-relaxed">
                    A little nudge, right on time. Get task reminders and league updates, even when
                    BjeyFlow is closed.
                </p>
            </div>
            <div className="border-input bg-card mt-4 rounded-2xl border p-4">
                <div className="flex items-center gap-2 text-xs font-semibold" role="status">
                    <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-xl">
                        {push.enabled ? <Check size={16} /> : <Smartphone size={16} />}
                    </span>
                    {status}
                </div>
                <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
                    {push.enabled
                        ? 'This device is registered for push notifications.'
                        : push.permission === 'denied'
                          ? 'Allow notifications in your browser or device settings to connect.'
                          : 'Connect this device to receive your gentle reminders.'}
                </p>
            </div>
            <div className="mt-4">
                {!push.enabled ? (
                    <Button
                        type="button"
                        className="bg-brand mb-4 h-11 w-full rounded-xl text-xs font-bold text-white shadow-[0_4px_0_#087c94] transition-transform active:translate-y-1 active:shadow-none"
                        disabled={
                            !push.supported ||
                            checking ||
                            push.permission === 'denied' ||
                            !push.config.data?.configured
                        }
                        isPending={push.enable.isPending}
                        onClick={() => push.enable.mutate()}
                    >
                        Enable on this device
                    </Button>
                ) : (
                    <div className="mb-4 flex flex-col gap-3">
                        <Button
                            type="button"
                            className="bg-brand h-11 w-full rounded-xl text-xs font-bold text-white shadow-[0_4px_0_#087c94] transition-transform active:translate-y-1 active:shadow-none"
                            isPending={push.sendTest.isPending}
                            onClick={() => push.sendTest.mutate()}
                        >
                            Send a test notification
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full rounded-xl text-xs"
                            isPending={push.disable.isPending}
                            onClick={() => push.disable.mutate()}
                        >
                            Turn off on this device
                        </Button>
                    </div>
                )}
            </div>
            {!push.supported && (
                <p className="text-muted-foreground mb-3 text-xs">
                    Use a supported browser over HTTPS. On iPhone, add BjeyFlow to your Home Screen
                    first.
                </p>
            )}
            {push.supported && push.config.isSuccess && !push.config.data.configured && (
                <p className="text-muted-foreground mb-3 text-xs">
                    The server has not configured push notifications yet.
                </p>
            )}
            {push.permission === 'denied' && (
                <p className="text-destructive mb-3 text-xs">
                    Notifications are blocked. Allow them in your browser or device settings, then
                    return here.
                </p>
            )}
            {push.enabled && !preferences.browserNotifications && (
                <p className="text-muted-foreground mb-3 flex items-center gap-2 text-xs">
                    <BellOff size={14} /> Reminders are paused across your account.
                </p>
            )}
            {push.sendTest.isSuccess && (
                <p className="text-muted-foreground mb-3 text-xs">
                    Test accepted by the push service; delivery depends on your device.
                </p>
            )}
            <DisplayError
                error={
                    push.config.error ||
                    push.devices.error ||
                    push.enable.error ||
                    push.disable.error ||
                    push.sendTest.error
                }
            />
            <div className="border-input bg-card rounded-2xl border px-4">
                <PreferenceToggle
                    label="Reminders and updates"
                    description="Pause or resume reminders across your account. Device permissions are managed separately."
                    checked={preferences.browserNotifications}
                    onChange={(value) => preferences.setPreference('browserNotifications', value)}
                />
            </div>
            <div className="border-input mt-4 rounded-2xl border px-4">
                <h3 className="text-foreground pt-4 text-xs font-semibold">More gentle nudges</h3>
                <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed">
                    Optional updates, off until you choose them. Your account reminder switch and
                    quiet hours apply to all of these.
                </p>
                {(
                    [
                        [
                            'returnNotifications',
                            'A little welcome back',
                            'One reminder after 3 days away. We will not repeat it until you return.',
                        ],
                        [
                            'goalNotifications',
                            'Goal milestones',
                            'When a tracked goal crosses 80% or all of its milestones are complete.',
                        ],
                        [
                            'leagueRankNotifications',
                            'League promotion zone',
                            'Once per week when you move into the promotion zone. Your final position may change.',
                        ],
                        [
                            'weeklyReviewNotifications',
                            'Your weekly review',
                            'At 09:00 on your first day of the week, if you completed tasks last week.',
                        ],
                        [
                            'dailyPlanNotifications',
                            'Your daily plan',
                            'At your chosen time, only when unfinished tasks are due today.',
                        ],
                    ] as const
                ).map(([key, label, description]) => (
                    <PreferenceToggle
                        key={key}
                        label={label}
                        description={description}
                        checked={preferences[key]}
                        onChange={(value) => preferences.setPreference(key, value)}
                    />
                ))}
                <div className="pb-4">
                    <LabeledInput
                        type="time"
                        label="Daily plan time"
                        value={preferences.dailyPlanTime}
                        disabled={!preferences.dailyPlanNotifications}
                        onChange={(event) => {
                            if (event.target.value)
                                preferences.setPreference('dailyPlanTime', event.target.value);
                        }}
                    />
                </div>
            </div>
            <div className="border-input mt-5 border-t pt-5">
                <h3 className="text-foreground mb-1 flex items-center gap-2 text-xs font-semibold">
                    <Clock3 size={15} /> Your reminder schedule
                </h3>
                <p className="text-muted-foreground mb-4 text-[11px] leading-relaxed">
                    Tasks without a time are due at 09:00 in your selected time zone. Focus alerts
                    require the timer page to remain open.
                </p>
            </div>
            <LabeledSelect
                label="Remind me"
                value={String(preferences.reminderMinutes)}
                onValueChange={(value) =>
                    preferences.setPreference('reminderMinutes', Number(value))
                }
                options={[
                    { value: '0', label: 'At the due time' },
                    ...[5, 15, 30, 60, 1440].map((value) => ({
                        value: String(value),
                        label: value === 1440 ? '1 day before' : `${value} minutes before`,
                    })),
                ]}
            />
            <PreferenceToggle
                label="Quiet hours"
                description="Do not send browser reminders during this period. Suppressed reminders are not replayed. Equal start and end means no quiet period."
                checked={preferences.quietHours}
                onChange={(value) => preferences.setPreference('quietHours', value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
                <LabeledInput
                    type="time"
                    label="Quiet from"
                    value={preferences.quietStart}
                    disabled={!preferences.quietHours}
                    onChange={(event) => {
                        if (event.target.value)
                            preferences.setPreference('quietStart', event.target.value);
                    }}
                />
                <LabeledInput
                    type="time"
                    label="Until"
                    value={preferences.quietEnd}
                    disabled={!preferences.quietHours}
                    onChange={(event) => {
                        if (event.target.value)
                            preferences.setPreference('quietEnd', event.target.value);
                    }}
                />
            </div>
        </section>
    );
}
