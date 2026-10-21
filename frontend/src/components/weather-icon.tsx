import { forwardRef, useEffect, useState } from 'react';
import type { LucideProps } from 'lucide-react';
import { useCurrentWeather } from '@/app/weather/hooks/use-current-weather';
import { getWeatherIcon } from '@/app/weather/weather-icon';

export const WeatherIcon = forwardRef<SVGSVGElement, LucideProps>(function WeatherIcon(props, ref) {
    const { data } = useCurrentWeather();
    const [hour, setHour] = useState(() => new Date().getHours());
    useEffect(() => {
        const timer = window.setInterval(() => setHour(new Date().getHours()), 60_000);
        return () => window.clearInterval(timer);
    }, []);
    const isDay = data?.is_day ?? (hour >= 6 && hour < 18);
    // A local day/night symbol is a fallback, not a claim of clear weather.
    const Icon = getWeatherIcon(data?.available ? data.condition : 'clear', isDay);
    const description = data?.available
        ? `${data.description}${!isDay ? ' · Night' : ''}${data.location ? ` · ${data.location}` : ''}`
        : `${isDay ? 'Daytime' : 'Nighttime'} · Weather unavailable`;
    return (
        <Icon ref={ref} aria-label={description} {...props}>
            <title>{description}</title>
            {props.children}
        </Icon>
    );
});
