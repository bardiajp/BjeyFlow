import { isAxiosError } from 'axios';
import { ZodError } from 'zod';

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
    if (!error) return null;
    return (
        <div
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border p-3 text-sm"
        >
            {errorMessage(error)}
            {onRetry && (
                <button type="button" onClick={onRetry} className="ml-3 underline">
                    Retry
                </button>
            )}
        </div>
    );
}
