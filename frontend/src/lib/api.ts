import axios from 'axios';
import useUserStore from '@/store/use-user-store';

const configuredHost = import.meta.env.VITE_HOST || 'localhost';
const browserHost = globalThis.location?.hostname;
const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
// Keep local cookie authentication same-site for either localhost or 127.0.0.1.
const host =
    browserHost && loopbackHosts.has(browserHost) && loopbackHosts.has(configuredHost)
        ? browserHost
        : configuredHost;
const port = import.meta.env.VITE_BACKEND_PORT || '8100';

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || `http://${host}:${port}`,
    withCredentials: true,
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) useUserStore.getState().clearUser();
        return Promise.reject(error);
    }
);
