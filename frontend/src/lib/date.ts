import { usePreferences } from '@/store/use-preferences';

export function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDays(day: string, count: number) {
    const date = new Date(`${day}T12:00:00`);
    date.setDate(date.getDate() + count);
    return localDate(date);
}

export function formatTime(value: string) {
    return new Date(`2000-01-01T${value}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hourCycle: usePreferences.getState().hourCycle,
    });
}

export function formatDay(value: string) {
    return formatCalendarDate(value, { month: 'short', day: 'numeric' });
}

export function selectedTimeZone() {
    const zone = usePreferences.getState().timeZone;
    return zone === 'system' ? Intl.DateTimeFormat().resolvedOptions().timeZone : zone;
}

export function todayDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedTimeZone(),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const part = (type: string) => parts.find((item) => item.type === type)!.value;
    return `${part('year')}-${part('month')}-${part('day')}`;
}

export function formatCalendarDate(value: string, options: Intl.DateTimeFormatOptions) {
    const calendar = usePreferences.getState().calendar;
    return new Date(`${value}T12:00:00Z`).toLocaleDateString(
        calendar === 'persian' ? 'fa-IR' : 'en-US',
        { ...options, calendar, timeZone: 'UTC' }
    );
}

export function calendarParts(value: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
        calendar: usePreferences.getState().calendar,
        timeZone: 'UTC',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    }).formatToParts(new Date(`${value}T12:00:00Z`));
    const part = (type: string) => Number(parts.find((item) => item.type === type)!.value);
    return { year: part('year'), month: part('month'), day: part('day') };
}

export function calendarMonthStart(value: string) {
    return addDays(value, 1 - calendarParts(value).day);
}

export function shiftCalendarMonth(value: string, amount: number) {
    let start = calendarMonthStart(value);
    const day = calendarParts(value).day;
    for (let index = 0; index < Math.abs(amount); index++) {
        start = calendarMonthStart(addDays(start, amount > 0 ? 32 : -1));
    }
    const nextStart = calendarMonthStart(addDays(start, 32));
    const last = addDays(nextStart, -1);
    return addDays(start, Math.min(day, calendarParts(last).day) - 1);
}

export function weekLabels() {
    const { weekStart, calendar } = usePreferences.getState();
    return Array.from({ length: 7 }, (_, index) =>
        new Date(Date.UTC(2024, 0, 7 + ((weekStart + index) % 7))).toLocaleDateString(
            calendar === 'persian' ? 'fa-IR' : 'en-US',
            { weekday: 'short', timeZone: 'UTC' }
        )
    );
}

export function formatTimestamp(
    value: string,
    options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
) {
    const { calendar, hourCycle } = usePreferences.getState();
    return new Date(value).toLocaleString(calendar === 'persian' ? 'fa-IR' : 'en-US', {
        ...options,
        calendar,
        hourCycle,
        timeZone: selectedTimeZone(),
    });
}

export function zonedDateTime(day: string, time: string) {
    const target = Date.parse(`${day}T${time.slice(0, 5)}:00Z`);
    let result = target;
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: selectedTimeZone(),
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    });
    for (let index = 0; index < 3; index++) {
        const parts = formatter.formatToParts(new Date(result));
        const part = (type: string) => parts.find((item) => item.type === type)!.value;
        const represented = Date.parse(
            `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}Z`
        );
        result += target - represented;
    }
    return result;
}
