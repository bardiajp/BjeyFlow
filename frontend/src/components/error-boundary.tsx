import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorState from './error-state';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('BjeyFlow rendering failed', error, info.componentStack);
    }

    render() {
        return this.state.failed ? (
            <ErrorState kind="unexpected" fullPage onRetry={() => window.location.reload()} />
        ) : (
            this.props.children
        );
    }
}
