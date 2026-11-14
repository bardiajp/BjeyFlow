import {
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudHail,
    CloudMoon,
    CloudOff,
    CloudRain,
    CloudSnow,
    CloudSun,
    Moon,
    Sun,
    TriangleAlert,
    Wind,
    type LucideIcon,
} from 'lucide-react';
import type { WeatherCondition } from './types';

export function getWeatherIcon(condition: WeatherCondition, isDay: boolean): LucideIcon {
    switch (condition) {
        case 'clear':
            return isDay ? Sun : Moon;
        case 'partly_cloudy':
            return isDay ? CloudSun : CloudMoon;
        case 'cloudy':
            return Cloud;
        case 'rain':
            return CloudRain;
        case 'drizzle':
            return CloudDrizzle;
        case 'snow':
            return CloudSnow;
        case 'sleet':
            return CloudHail;
        case 'fog':
            return CloudFog;
        case 'wind':
            return Wind;
        case 'storm':
            return TriangleAlert;
        default:
            return CloudOff;
    }
}
