import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { getSiteSettings, saveSiteSettings, type SiteSettings } from './api';
import { LabeledInput } from '@/components/form/labeled';
import { LabeledTextarea } from '@/components/form/labeled-textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { InlineConfirm } from '@/components/inline-confirm';
import DisplayError from '@/components/display-error';
import Loading from '@/components/loading';
import { toast } from '@/components/ui/toast';
import useUserStore from '@/store/use-user-store';
import { formatTimestamp } from '@/lib/date';

function SettingsForm({ settings }: { settings: SiteSettings }) {
    const user = useUserStore((state) => state.user);
    const client = useQueryClient();
    const canEdit = user?.role === 'superuser';
    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<Omit<SiteSettings, 'updated_at'>>({ defaultValues: settings });
    const mutation = useMutation({
        mutationFn: saveSiteSettings,
        onSuccess: async () => {
            toast.add({ type: 'success', title: 'Workspace settings updated' });
            await Promise.all([
                client.invalidateQueries({ queryKey: ['admin', 'settings'] }),
                client.invalidateQueries({ queryKey: ['public-settings'] }),
            ]);
        },
    });
    return (
        <form
            className="editor-form bg-card border-input grid gap-6 rounded-3xl border p-5 sm:p-7"
            onSubmit={(event) => event.preventDefault()}
        >
            <div>
                <h2 className="text-foreground text-lg font-medium">
                    The details that shape your space<span className="text-secondary">.</span>
                </h2>
                <p className="text-muted-foreground mt-2 text-xs leading-6">
                    {canEdit
                        ? 'Changes apply across the workspace. Only system administrators can save them.'
                        : 'Read-only. A system administrator manages these settings.'}
                </p>
            </div>
            <fieldset disabled={!canEdit || mutation.isPending} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                    <LabeledInput
                        label="Application name"
                        maxLength={60}
                        error={errors.app_name?.message}
                        {...register('app_name', {
                            required: 'Enter an application name.',
                            maxLength: 60,
                        })}
                    />
                    <LabeledInput
                        label="Support email"
                        type="email"
                        maxLength={254}
                        {...register('support_email')}
                    />
                </div>
                <div className="border-input flex items-start gap-3 rounded-2xl border p-4">
                    <Controller
                        name="signup_enabled"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                id="allow-signup"
                                checked={field.value}
                                onCheckedChange={(value) => field.onChange(value)}
                            />
                        )}
                    />
                    <label htmlFor="allow-signup" className="text-foreground text-sm">
                        Allow new registrations
                        <span className="text-muted-foreground mt-1 block text-xs leading-6">
                            Existing users can still sign in. Already-issued verification codes
                            remain usable.
                        </span>
                    </label>
                </div>
                <LabeledTextarea
                    label="Workspace announcement"
                    rows={3}
                    maxLength={500}
                    placeholder="A small update for everyone…"
                    {...register('announcement')}
                />
                <LabeledTextarea
                    label="Maintenance notice"
                    rows={3}
                    maxLength={500}
                    placeholder="Let people know about planned maintenance…"
                    {...register('maintenance_notice')}
                />
                <p className="text-muted-foreground -mt-3 text-xs leading-6">
                    Notices are visible on sign-in and workspace pages. A maintenance notice does
                    not shut down the application.
                </p>
                <LabeledInput
                    label="Trash retention · days"
                    type="number"
                    min={0}
                    max={365}
                    error={errors.trash_retention_days?.message}
                    {...register('trash_retention_days', {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Use 0 to keep tasks indefinitely.' },
                        max: { value: 365, message: 'Use no more than 365 days.' },
                        validate: (value) =>
                            Number.isInteger(value) || 'Enter a whole number of days.',
                    })}
                />
                <p className="text-muted-foreground -mt-3 text-xs leading-6">
                    0 keeps trashed tasks indefinitely. A positive value allows scheduled cleanup to
                    permanently remove older tasks and their subtasks. Install the production
                    cleanup timer before relying on automatic cleanup.
                </p>
            </fieldset>
            <div className="border-input flex flex-wrap items-center justify-between gap-4 border-t pt-5">
                <p className="text-muted-foreground text-[10px]">
                    Last saved {formatTimestamp(settings.updated_at)}
                </p>
                {canEdit && (
                    <InlineConfirm
                        label="Save workspace settings"
                        tone="normal"
                        title="Apply settings?"
                        description="These changes affect everyone. A nonzero Trash retention policy permits permanent deletion of old trashed tasks by the scheduled cleanup job."
                        confirmLabel="Save workspace settings"
                        disabled={mutation.isPending}
                        onConfirm={handleSubmit(
                            async (values) => {
                                await mutation.mutateAsync(values);
                            },
                            () => {
                                throw new Error('Check the highlighted settings before saving.');
                            }
                        )}
                    >
                        <Save size={14} /> Save changes
                    </InlineConfirm>
                )}
            </div>
        </form>
    );
}

export default function AdminSettings() {
    const query = useQuery({ queryKey: ['admin', 'settings'], queryFn: getSiteSettings });
    if (query.isPending) return <Loading />;
    if (query.error)
        return <DisplayError error={query.error} onRetry={() => void query.refetch()} />;
    return <SettingsForm key={query.data.updated_at} settings={query.data} />;
}
