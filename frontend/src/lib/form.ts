import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ZodIssue } from 'zod';

export function setValidationErrors<T extends FieldValues>(
    issues: ZodIssue[],
    setError: UseFormSetError<T>
) {
    issues.forEach((issue, index) => {
        setError(
            issue.path.join('.') as Path<T>,
            { type: 'validate', message: issue.message },
            { shouldFocus: index === 0 }
        );
    });
}
