import axios from 'axios';
import useUserStore from '@/store/use-user-store';

const host = import.meta.env.VITE_HOST || 'localhost';
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
