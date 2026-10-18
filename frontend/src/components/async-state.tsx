import type { ReactNode } from 'react';
import DisplayError from './display-error';

export default function AsyncState({
    isLoading,
    loadingComponent,
    component,
    error,
}: {
    isLoading: boolean;
    loadingComponent: ReactNode;
    component: ReactNode;
    error?: unknown;
}) {
    if (error) return <DisplayError error={error} />;
    return isLoading ? loadingComponent : component;
}
