import { createContext, useContext } from 'react';
import type { PublicSettings } from '@/app/admin/api';

export const SiteSettingsContext = createContext<PublicSettings | null>(null);

export function useSiteSettings() {
    const settings = useContext(SiteSettingsContext);
    if (settings === null) throw new Error('Site settings provider is missing.');
    return settings;
}
