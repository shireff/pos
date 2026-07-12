import axios, {
    type AxiosRequestHeaders,
    type InternalAxiosRequestConfig,
    AxiosError,
} from 'axios';
import { getAuthSession, removeAuthSession } from '../storage/secureStorage';
import { getLocale } from '@packages/shared-kernel';

const baseURL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

const timeout = 15_000;

export const client = axios.create({ baseURL, timeout });

// ─── Request interceptor — attach Bearer token + locale ───────────────────────
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    config.headers = (config.headers ?? {}) as AxiosRequestHeaders;
    const session = await getAuthSession();
    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    config.headers['Accept-Language'] = getLocale();
    return config;
});

// ─── Response interceptor — clear session on 401 ─────────────────────────────
client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            await removeAuthSession();
        }
        return Promise.reject(error);
    },
);
