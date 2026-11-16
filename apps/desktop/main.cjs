const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const APP_URL = 'https://bjeyflow.space/';
const APP_ORIGIN = new URL(APP_URL).origin;

function isAppUrl(value) {
    try {
        return new URL(value).origin === APP_ORIGIN;
    } catch {
        return false;
    }
}

function createWindow() {
    const window = new BrowserWindow({
        width: 1360,
        height: 900,
        minWidth: 760,
        minHeight: 600,
        title: 'BjeyFlow',
        backgroundColor: '#f6f8fa',
        icon: app.isPackaged
            ? path.join(process.resourcesPath, 'icon.png')
            : path.join(__dirname, '../../frontend/public/icons/icon-512.png'),
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
    });

    window.webContents.on('will-navigate', (event, url) => {
        if (isAppUrl(url)) return;
        event.preventDefault();
        if (url.startsWith('https://')) void shell.openExternal(url);
    });
    window.webContents.on('will-redirect', (event, url) => {
        if (isAppUrl(url)) return;
        event.preventDefault();
        if (url.startsWith('https://')) void shell.openExternal(url);
    });
    window.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://')) void shell.openExternal(url);
        return { action: 'deny' };
    });
    window.webContents.on('did-fail-load', (_event, code, _description, url, mainFrame) => {
        if (mainFrame && code !== -3 && isAppUrl(url)) {
            void window.loadFile(path.join(__dirname, 'offline.html'));
        }
    });
    void window.loadURL(APP_URL);
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
