export type WeatherCondition =
    | 'clear'
    | 'partly_cloudy'
    | 'cloudy'
    | 'rain'
    | 'drizzle'
    | 'snow'
    | 'sleet'
    | 'fog'
    | 'wind'
    | 'storm'
    | 'unknown';

export interface CurrentWeather {
    available: boolean;
    condition: WeatherCondition;
    description: string;
    temperature_c: number | null;
    timezone: string | null;
    location: string | null;
    is_day: boolean | null;
}
