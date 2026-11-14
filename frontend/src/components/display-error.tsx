import { isAxiosError } from 'axios';
import { ZodError } from 'zod';
import { useEffect, useEffectEvent } from 'react';
import { toast } from '@/components/ui/toast';

function errorMessage(error: unknown): string {
    if (error instanceof ZodError) return error.issues.map((issue) => issue.message).join(' ');
    if (isAxiosError(error)) {
        const body: unknown = error.response?.data;
        if (typeof body === 'object' && body !== null) {
            return Object.entries(body)
                .map(([key, value]) => {
                    const text = Array.isArray(value) ? value.join(' ') : String(value);
                    return key === 'detail' || key === 'non_field_errors'
                        ? text
                        : `${key}: ${text}`;
                })
                .join(' ');
        }
        return error.message;
    }
    return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function DisplayError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
    const message = error ? errorMessage(error) : null;
    const showToast = useEffectEvent(() =>
        toast.add({
            type: 'destructive',
            title: 'Something went wrong',
            description: message,
            actionProps: onRetry ? { children: 'Retry', onClick: onRetry } : undefined,
        })
    );

    useEffect(() => {
        if (!message) return;
        const id = showToast();
        return () => toast.close(id);
    }, [message]);

    return null;
}
