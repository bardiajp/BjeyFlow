import { useQuery } from '@tanstack/react-query';
import { getCurrentWeather } from '../api/current';

export function useCurrentWeather() {
    return useQuery({
        queryKey: ['weather', 'current'],
        queryFn: getCurrentWeather,
        staleTime: 5 * 60 * 1000,
        refetchInterval: 5 * 60 * 1000,
        retry: false,
    });
}
