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
    });
}

export function formatDay(value: string) {
    return new Date(`${value}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
