performance.mark('app-loading-start');

// Match the account preference before React loads, without requiring storage access.
(() => {
    let theme = 'system';
    try {
        const stored = JSON.parse(localStorage.getItem('bjeyflow-preferences') || 'null');
        const preference = stored?.state?.theme;
        if (['light', 'dark', 'system'].includes(preference)) theme = preference;
    } catch {
        // Blocked storage or invalid data should not prevent startup.
    }
    const dark = theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();
