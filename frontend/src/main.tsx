import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app';
import './index.css';
import { applyTheme } from './store/use-preferences';

applyTheme();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
            console.error('Service worker registration failed:', error);
        });
    });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>
);
