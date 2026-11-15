import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Camera, UserRound } from 'lucide-react';
import { updateProfile, type ProfileValues } from './api';
import { LabeledInput } from '@/components/form/labeled';
import { LabeledTextarea } from '@/components/form/labeled-textarea';
import { Button } from '@/components/ui/button';
import DisplayError from '@/components/display-error';
import { toast } from '@/components/ui/toast';
import useUserStore from '@/store/use-user-store';

export function ProfileSettings() {
    const user = useUserStore((state) => state.user)!;
    const client = useQueryClient();
    const input = useRef<HTMLInputElement>(null);
    const [imageError, setImageError] = useState<unknown>(null);
    const [processing, setProcessing] = useState(false);
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { isDirty },
    } = useForm<ProfileValues>({
        defaultValues: {
            display_name: user.display_name,
            avatar: user.avatar,
            flow_name: user.flow_name,
            north_star: user.north_star,
        },
    });
    const avatar = watch('avatar');
    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (data) => {
            useUserStore.getState().setUser(data.user);
            client.setQueryData(['status'], data);
            reset({
                display_name: data.user.display_name,
                avatar: data.user.avatar,
                flow_name: data.user.flow_name,
                north_star: data.user.north_star,
            });
            toast.add({ type: 'success', title: 'Profile updated' });
        },
    });
    const upload = async (file: File) => {
        setImageError(null);
        if (
            !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
            file.size > 10 * 1024 * 1024
        ) {
            setImageError(new Error('Choose a PNG, JPEG or WebP image smaller than 10 MB.'));
            return;
        }
        setProcessing(true);
        try {
            const image = await createImageBitmap(file);
            const canvas = document.createElement('canvas');
            canvas.width = 192;
            canvas.height = 192;
            const size = Math.min(image.width, image.height);
            canvas
                .getContext('2d')!
                .drawImage(
                    image,
                    (image.width - size) / 2,
                    (image.height - size) / 2,
                    size,
                    size,
                    0,
                    0,
                    192,
                    192
                );
            image.close();
            setValue('avatar', canvas.toDataURL('image/webp', 0.85), { shouldDirty: true });
        } catch {
            setImageError(
                new Error('This image could not be opened. Try another PNG, JPEG or WebP.')
            );
        } finally {
            setProcessing(false);
        }
    };
    return (
        <section className="border-input bg-card rounded-[22px] border p-5 sm:p-6">
            <h2 className="text-foreground mb-5 flex items-center gap-2 text-sm font-semibold">
                <UserRound size={16} />
                Your profile
            </h2>
            <form
                className="grid gap-5"
                onSubmit={handleSubmit((values) => mutation.mutate(values))}
            >
                <fieldset
                    disabled={mutation.isPending || processing}
                    className="grid min-w-0 gap-5"
                >
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="bg-brand text-primary flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-xl">
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt="Avatar preview"
                                    className="size-full object-cover"
                                />
                            ) : (
                                (user.display_name || user.username).slice(0, 1).toUpperCase()
                            )}
                        </span>
                        <input
                            ref={input}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            aria-label="Upload avatar"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void upload(file);
                                event.target.value = '';
                            }}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            className="h-9 gap-2 rounded-xl text-xs"
                            onClick={() => input.current!.click()}
                            disabled={processing}
                        >
                            <Camera size={14} />
                            {processing ? 'Preparing…' : 'Upload avatar'}
                        </Button>
                        {avatar && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-9 rounded-xl text-xs"
                                onClick={() => setValue('avatar', '', { shouldDirty: true })}
                            >
                                Remove
                            </Button>
                        )}
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                        PNG, JPEG or WebP, up to 10 MB. Center-cropped and optimized before upload.
                    </p>
                    <LabeledInput
                        label="Display name"
                        maxLength={150}
                        {...register('display_name')}
                    />
                    <LabeledInput
                        label="Personal space name"
                        maxLength={60}
                        placeholder="My little flow"
                        {...register('flow_name')}
                    />
                    <LabeledTextarea
                        label="Your north star"
                        maxLength={200}
                        rows={3}
                        placeholder="What would you like to move towards?"
                        {...register('north_star')}
                    />
                </fieldset>
                <DisplayError error={imageError || mutation.error} />
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        isPending={mutation.isPending}
                        disabled={!isDirty || processing}
                        className="bg-brand h-10 min-w-32 rounded-xl text-xs text-white"
                    >
                        Save profile
                    </Button>
                </div>
            </form>
        </section>
    );
}
