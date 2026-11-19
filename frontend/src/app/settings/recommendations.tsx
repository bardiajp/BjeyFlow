import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb } from 'lucide-react';
import { axiosInstance } from '@/lib/api';
import { LabeledInput } from '@/components/form/labeled';
import { LabeledTextarea } from '@/components/form/labeled-textarea';
import { Button } from '@/components/ui/button';
import DisplayError from '@/components/display-error';

export function RecommendationSettings() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const client = useQueryClient();
    const mutation = useMutation({
        mutationFn: (values: { title: string; description: string }) =>
            axiosInstance.post('/users/auth/recommendations/', values),
        onSuccess: () => {
            setTitle('');
            setDescription('');
            void client.invalidateQueries({ queryKey: ['admin', 'recommendations'] });
        },
    });
    return (
        <section>
            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <Lightbulb size={16} /> Suggest a feature
            </h2>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                What would make BjeyFlow easier for you? Your suggestion will be shared privately
                with the administrators, together with your username.
            </p>
            <form
                className="mt-4 grid gap-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (!mutation.isPending)
                        mutation.mutate({ title: title.trim(), description: description.trim() });
                }}
            >
                <LabeledInput
                    label="Your idea"
                    placeholder="A short title for your feature"
                    value={title}
                    maxLength={160}
                    required
                    disabled={mutation.isPending}
                    onChange={(event) => {
                        setTitle(event.target.value);
                        mutation.reset();
                    }}
                />
                <LabeledTextarea
                    label="How would it help?"
                    placeholder="Describe what you need and how it would improve your workflow."
                    value={description}
                    maxLength={2000}
                    required
                    disabled={mutation.isPending}
                    onChange={(event) => {
                        setDescription(event.target.value);
                        mutation.reset();
                    }}
                    description={`${description.length}/2000 characters`}
                />
                <Button
                    type="submit"
                    className="bg-brand w-full rounded-xl text-xs text-white sm:w-auto sm:justify-self-start"
                    isPending={mutation.isPending}
                    disabled={mutation.isPending || !title.trim() || !description.trim()}
                >
                    Send suggestion
                </Button>
                <DisplayError error={mutation.error} />
                {mutation.isSuccess && (
                    <p role="status" className="text-muted-foreground text-xs">
                        Thank you! Your suggestion has been sent to the administrators.
                    </p>
                )}
            </form>
        </section>
    );
}
