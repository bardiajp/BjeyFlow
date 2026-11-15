import { isAxiosError } from 'axios';
import { useEffect, useEffectEvent } from 'react';
import { toast } from '@/components/ui/toast';
import ErrorState from './error-state';
import { errorMessage } from '@/lib/error-message';

export default function DisplayError({
    error,
    onRetry,
    fullPage = false,
}: {
    error: unknown;
    onRetry?: () => void;
    fullPage?: boolean;
}) {
    const connectionError = isAxiosError(error) && !error.response;
    const serverError = isAxiosError(error) && !!error.response && error.response.status >= 500;
    const systemError = connectionError || serverError;
    const message = error && !systemError ? errorMessage(error) : null;
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

    return systemError ? (
        <ErrorState
            kind={connectionError ? 'connection' : 'server'}
            fullPage={fullPage}
            onRetry={onRetry ?? (() => window.location.reload())}
        />
    ) : null;
}
