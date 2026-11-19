export async function readPushDevice(
    ready: Promise<ServiceWorkerRegistration>,
    getPermission: () => NotificationPermission,
    timeoutMs = 15_000
) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const registration = await Promise.race([
            ready,
            new Promise<never>((_, reject) => {
                timer = setTimeout(
                    () =>
                        reject(
                            new Error(
                                'The notification service is not ready. Reload the app and try again.'
                            )
                        ),
                    timeoutMs
                );
            }),
        ]);
        return {
            subscription: await registration.pushManager.getSubscription(),
            permission: getPermission(),
        };
    } finally {
        clearTimeout(timer);
    }
}
