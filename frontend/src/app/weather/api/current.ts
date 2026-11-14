import { axiosInstance } from '@/lib/api';
import type { CurrentWeather } from '../types';

export async function getCurrentWeather({ signal }: { signal: AbortSignal }) {
    return (await axiosInstance.get<CurrentWeather>('api/weather/', { signal, timeout: 8000 }))
        .data;
}
