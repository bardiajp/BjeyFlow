import { BrowserRouter } from 'react-router';

import AppRoutes from './routes';
import Providers from './components/providers';
import { ErrorBoundary } from './components/error-boundary';

export default function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Providers>
                    <AppRoutes />
                </Providers>
            </ErrorBoundary>
        </BrowserRouter>
    );
}
