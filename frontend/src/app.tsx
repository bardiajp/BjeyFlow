import { BrowserRouter } from 'react-router';

import AppRoutes from './routes';
import Providers from './components/providers';

export default function App() {
    return (
        <BrowserRouter>
            <Providers>
                <AppRoutes />
            </Providers>
        </BrowserRouter>
    );
}
