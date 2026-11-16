import { Bell } from 'lucide-react';
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
    return (
        <section
            id="notifications"
            className="border-input bg-card scroll-mt-32 rounded-[22px] border p-5 sm:p-6"
        >
            <h2 className="text-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
                <Bell size={16} />
                Gentle reminders
            </h2>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
                Task reminders and league updates can reach this device even when BjeyFlow is closed. Tasks without a
                time are due at 09:00 in your selected time zone. On iPhone, install BjeyFlow to the
                Home Screen first. Delivery depends on device and network settings.
            </p>
            <PreferenceToggle
                label="Task and league notifications"
                description="Pause or resume notifications across your account. Device permissions are managed separately."
                checked={preferences.browserNotifications}
                disabled={!push.enabled}
                onChange={(value) => preferences.setPreference('browserNotifications', value)}
            />
            {!push.enabled ? (
                <Button
                    type="button"
                    className="bg-brand mb-4 h-11 w-full rounded-xl text-xs text-white"
                    disabled={
                        !push.supported || push.config.isPending || !push.config.data?.configured
                    }
                    isPending={push.enable.isPending}
                    onClick={() => push.enable.mutate()}
                >
                    Enable on this device
                </Button>
            ) : (
                <div className="mb-4 flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl text-xs"
                        isPending={push.sendTest.isPending}
                        onClick={() => push.sendTest.mutate()}
                    >
                        Send a test notification
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl text-xs"
                        isPending={push.disable.isPending}
                        onClick={() => push.disable.mutate()}
                    >
                        Turn off on this device
                    </Button>
                </div>
            )}
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
                    Notifications are blocked in your device settings.
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
