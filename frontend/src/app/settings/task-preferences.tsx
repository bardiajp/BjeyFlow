import { CalendarDays, ListChecks } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@/app/projects/api/list';
import { LabeledSelect } from '@/components/form/labeled-select';
import { usePreferences } from '@/store/use-preferences';
import { PreferenceToggle } from './preference-toggle';
import DisplayError from '@/components/display-error';

export function TaskPreferences() {
    const preferences = usePreferences();
    const { setPreference } = preferences;
    const projects = useQuery({ queryKey: ['projects'], queryFn: listProjects, staleTime: 30_000 });
    const available = projects.data?.filter((project) => !project.is_archived) ?? [];
    const missingProject =
        preferences.defaultProject &&
        !available.some((project) => project.id === preferences.defaultProject);
    return (
        <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
            <h2 className="text-foreground mb-5 flex items-center gap-2 text-sm font-semibold">
                <ListChecks size={16} />A head start for your tasks
            </h2>
            <div className="grid gap-5">
                <LabeledSelect
                    label="Default project"
                    value={preferences.defaultProject || ''}
                    onValueChange={(value) => setPreference('defaultProject', value || null)}
                    disabled={projects.isPending || projects.isError}
                    options={[
                        { value: '', label: 'First available project' },
                        ...(missingProject
                            ? [
                                  {
                                      value: preferences.defaultProject!,
                                      label: 'Unavailable project · choose another',
                                      disabled: true,
                                  },
                              ]
                            : []),
                        ...available.map((project) => ({
                            value: project.id,
                            label: `${project.key} · ${project.name}`,
                        })),
                    ]}
                    description="Opening a task from a project still uses that project. If the default is unavailable, a new task uses the first active project."
                />
                <DisplayError error={projects.error} onRetry={() => void projects.refetch()} />
                <LabeledSelect
                    label="Default priority"
                    value={preferences.defaultPriority}
                    onValueChange={(value) =>
                        setPreference(
                            'defaultPriority',
                            value as typeof preferences.defaultPriority
                        )
                    }
                    options={['low', 'normal', 'high', 'urgent'].map((value) => ({
                        value,
                        label: value[0].toUpperCase() + value.slice(1),
                    }))}
                />
                <LabeledSelect
                    label="Default task order"
                    value={preferences.taskOrdering}
                    onValueChange={(value) =>
                        setPreference('taskOrdering', value as typeof preferences.taskOrdering)
                    }
                    options={[
                        { value: 'position,created_at', label: 'Manual order' },
                        { value: 'due_date,due_time', label: 'Due date · earliest first' },
                        { value: '-created_at', label: 'Newest first' },
                        { value: 'created_at', label: 'Oldest first' },
                        { value: 'title', label: 'Title · A to Z' },
                        { value: '-title', label: 'Title · Z to A' },
                    ]}
                    description="Upcoming stays ordered by due date. Board columns keep their manual order."
                />
                <PreferenceToggle
                    label="Hide completed tasks"
                    description="Hide them from regular views. The Completed page and explicit status filters still show them."
                    checked={preferences.hideCompleted}
                    onChange={(value) => setPreference('hideCompleted', value)}
                />
            </div>
        </section>
    );
}

export function DatePreferences() {
    const preferences = usePreferences();
    const { setPreference } = preferences;
    const zones = Intl.supportedValuesOf('timeZone');
    if (!zones.includes('UTC')) zones.unshift('UTC');
    if (preferences.timeZone !== 'system' && !zones.includes(preferences.timeZone))
        zones.unshift(preferences.timeZone);
    return (
        <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
            <h2 className="text-foreground mb-5 flex items-center gap-2 text-sm font-semibold">
                <CalendarDays size={16} />
                Your calendar & clock
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
                <LabeledSelect
                    label="Calendar"
                    value={preferences.calendar}
                    onValueChange={(value) =>
                        setPreference('calendar', value as typeof preferences.calendar)
                    }
                    options={[
                        { value: 'gregory', label: 'Gregorian · میلادی' },
                        { value: 'persian', label: 'Persian · شمسی' },
                    ]}
                />
                <LabeledSelect
                    label="Week starts on"
                    value={String(preferences.weekStart)}
                    onValueChange={(value) =>
                        setPreference('weekStart', Number(value) as typeof preferences.weekStart)
                    }
                    options={[
                        { value: '6', label: 'Saturday · شنبه' },
                        { value: '0', label: 'Sunday' },
                        { value: '1', label: 'Monday' },
                    ]}
                />
                <LabeledSelect
                    label="Time format"
                    value={preferences.hourCycle}
                    onValueChange={(value) =>
                        setPreference('hourCycle', value as typeof preferences.hourCycle)
                    }
                    options={[
                        { value: 'h23', label: '24-hour · 14:30' },
                        { value: 'h12', label: '12-hour · 2:30 PM' },
                    ]}
                />
                <LabeledSelect
                    label="Time zone"
                    value={preferences.timeZone}
                    onValueChange={(value) => setPreference('timeZone', value)}
                    options={[
                        { value: 'system', label: 'Use this device’s time zone' },
                        ...zones.map((zone) => ({ value: zone, label: zone.replaceAll('_', ' ') })),
                    ]}
                />
            </div>
            <p className="text-muted-foreground mt-4 text-[11px] leading-relaxed">
                Calendar changes affect display and date picking; task dates stay unchanged. Due
                times and quiet hours are interpreted in your selected time zone.
            </p>
        </section>
    );
}
