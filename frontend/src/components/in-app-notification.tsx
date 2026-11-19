import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { NotificationArtCard } from './notification-art-card';

interface NotificationMessage {
    type: 'bjeyflow-push';
    title: string;
    body: string;
    url: string;
    image: string;
}

export function InAppNotification() {
    const [message, setMessage] = useState<NotificationMessage | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const receive = (value: unknown) => {
            if (!value || typeof value !== 'object') return;
            const data = value as Record<string, unknown>;
            if (
                data.type !== 'bjeyflow-push' ||
                typeof data.title !== 'string' ||
                typeof data.body !== 'string' ||
                typeof data.url !== 'string' ||
                typeof data.image !== 'string'
            ) return;
            try {
                if (
                    new URL(data.url, location.origin).origin !== location.origin ||
                    new URL(data.image, location.origin).origin !== location.origin
                ) return;
                setMessage({ type: 'bjeyflow-push', title: data.title, body: data.body, url: data.url, image: data.image });
            } catch {
                // Ignore malformed messages.
            }
        };
        const onMessage = (event: MessageEvent) => receive(event.data);
        const onLocal = (event: Event) => receive((event as CustomEvent).detail);
        navigator.serviceWorker?.addEventListener('message', onMessage);
        window.addEventListener('bjeyflow-notification', onLocal);
        return () => {
            navigator.serviceWorker?.removeEventListener('message', onMessage);
            window.removeEventListener('bjeyflow-notification', onLocal);
        };
    }, []);

    if (!message) return null;
    return (
        <div className="fixed right-4 bottom-4 z-[1000] w-[calc(100%-2rem)] max-w-md drop-shadow-xl">
            <div role="status">
                <NotificationArtCard title={message.title} body={message.body} image={message.image} />
            </div>
            <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setMessage(null)}
                className="absolute top-3 right-3 rounded-full bg-[#023047]/70 p-2 text-white"
            >
                <X size={16} />
            </button>
            <button
                type="button"
                className="absolute right-4 bottom-3 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white"
                onClick={() => {
                    const target = new URL(message.url, location.origin);
                    setMessage(null);
                    navigate(`${target.pathname}${target.search}${target.hash}`);
                }}
            >
                Open
            </button>
        </div>
    );
}
