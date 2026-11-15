import { useState } from 'react';
import { Bell } from 'lucide-react';
import { usePreferences } from '@/store/use-preferences';
import { PreferenceToggle } from './preference-toggle';
import { LabeledSelect } from '@/components/form/labeled-select';
import { LabeledInput } from '@/components/form/labeled';
import { Button } from '@/components/ui/button';
import DisplayError from '@/components/display-error';

export function NotificationSettings() {
    const preferences = usePreferences();
    const [permission, setPermission] = useState(() =>
        'Notification' in window ? Notification.permission : 'unsupported'
    );
    const [error, setError] = useState<unknown>(null);
    const supported = 'Notification' in window && window.isSecureContext;
    const enable = async () => {
        setError(null);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') preferences.setPreference('browserNotifications', true);
            else
                setError(
                    new Error(
                        'Notifications were not enabled. Allow them in your browser’s site settings to continue.'
                    )
                );
        } catch {
            setError(
                new Error(
                    'This browser could not enable notifications. In-app reminders are still available.'
                )
            );
        }
    };
    return (
        <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
            <h2 className="text-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
                <Bell size={16} />
                Gentle reminders
            </h2>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
                Browser reminders work while BjeyFlow is open. Background tabs may be delayed by
                your browser. Tasks without a time are due at 09:00 in your selected time zone.
            </p>
            <PreferenceToggle
                label="Browser notifications"
                description={
                    !supported
                        ? 'Not supported here. Use a compatible browser over HTTPS.'
                        : permission === 'granted'
                          ? 'Permission granted on this device.'
                          : 'Permission must be granted separately on each device.'
                }
                checked={preferences.browserNotifications && permission === 'granted'}
                disabled={!supported || permission !== 'granted'}
                onChange={(value) => preferences.setPreference('browserNotifications', value)}
            />
            {supported && permission !== 'granted' && (
                <Button
                    type="button"
                    variant="outline"
                    className="mb-4 h-9 rounded-xl text-xs"
                    onClick={() => void enable()}
                >
                    Enable on this device
                </Button>
            )}
            <DisplayError error={error} />
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
