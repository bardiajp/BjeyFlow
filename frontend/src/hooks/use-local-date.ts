import { useEffect, useState } from 'react';
import { localDate } from '@/lib/date';

export function useLocalDate() {
    const [today, setToday] = useState(() => localDate());
    useEffect(() => {
        const interval = setInterval(() => setToday(localDate()), 60_000);
        return () => clearInterval(interval);
    }, []);
    return today;
}
