import { useEffect } from 'react';
import type { Task } from '@/app/tasks/types';
import { selectedTimeZone, zonedDateTime } from '@/lib/date';
import { usePreferences } from '@/store/use-preferences';
import useUserStore from '@/store/use-user-store';
import { toast } from '@/components/ui/toast';

export function useTaskNotifications(tasks: Task[], onOpenTask: (id: string) => void) {
    const preferences = usePreferences();
    const userId = useUserStore((state) => state.user?.id);

    useEffect(() => {
        if (
            !userId ||
            !preferences.browserNotifications ||
            !('Notification' in window) ||
            Notification.permission !== 'granted'
        )
            return;
        const storageKey = `bjeyflow-reminders:${userId}`;
        let cancelled = false;
        const check = () => {
            if (cancelled || useUserStore.getState().user?.id !== userId) return;
            const now = Date.now();
            const clock = new Intl.DateTimeFormat('en-GB', {
                timeZone: selectedTimeZone(),
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
            }).format(now);
            const { quietStart, quietEnd, quietHours } = preferences;
            const quiet =
                quietHours &&
                (quietStart <= quietEnd
                    ? clock >= quietStart && clock < quietEnd
                    : clock >= quietStart || clock < quietEnd);
            const sent: Record<string, number> = JSON.parse(
                localStorage.getItem(storageKey) ?? '{}'
            );
            let changed = false;
            for (const task of tasks) {
                if (!task.due_date || task.status === 'completed') continue;
                const due = zonedDateTime(task.due_date, task.due_time || '09:00');
                const reminder = due - preferences.reminderMinutes * 60_000;
                const key = `${task.id}:${due}:${preferences.reminderMinutes}`;
                if (now < reminder || now > due + 60_000 || sent[key]) continue;
                if (!quiet) {
                    try {
                        const notification = new Notification(
                            `${task.identifier} · ${task.title}`,
                            {
                                body: `${task.project_name} · ${preferences.reminderMinutes ? `Due in ${preferences.reminderMinutes} minutes or less` : 'Due now'}`,
                                icon: '/images/ball.svg',
                                tag: key,
                            }
                        );
                        notification.onclick = () => {
                            window.focus();
                            onOpenTask(task.id);
                            notification.close();
                        };
                    } catch {
                        usePreferences.getState().setPreference('browserNotifications', false);
                        toast.add({
                            type: 'error',
                            title: 'Browser notifications unavailable',
                            description:
                                'This browser could not display a notification. In-app reminders are still available.',
                        });
                        return;
                    }
                }
                sent[key] = now;
                changed = true;
            }
            if (changed)
                localStorage.setItem(
                    storageKey,
                    JSON.stringify(
                        Object.fromEntries(
                            Object.entries(sent).filter(
                                ([, timestamp]) => now - timestamp < 30 * 86400_000
                            )
                        )
                    )
                );
        };
        const run = () => {
            if (navigator.locks) void navigator.locks.request(storageKey, check);
            else check();
        };
        run();
        const timer = window.setInterval(run, 15_000);
        window.addEventListener('focus', run);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
            window.removeEventListener('focus', run);
        };
    }, [tasks, onOpenTask, userId, preferences]);
}
