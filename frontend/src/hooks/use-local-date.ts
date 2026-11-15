import { useEffect, useState } from 'react';
import { todayDate } from '@/lib/date';
import { usePreferences } from '@/store/use-preferences';

export function useLocalDate() {
    usePreferences((state) => state.timeZone);
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(interval);
    }, []);
    return todayDate(now);
}
