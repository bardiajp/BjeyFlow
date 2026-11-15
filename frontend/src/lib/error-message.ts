import { isAxiosError } from 'axios';
import { ZodError } from 'zod';

export function errorMessage(error: unknown): string {
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
