import axios, {
  AxiosError,
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getAuthSession, removeAuthSession } from '../storage/secureStorage';

const baseURL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
const timeout: number = Number(import.meta.env.VITE_API_TIMEOUT ?? '30000');

export const client = axios.create({
  baseURL,
  timeout,
});

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  config.headers = (config.headers ?? {}) as AxiosRequestHeaders;

  const session = await getAuthSession();
  const token = session?.token ?? null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await removeAuthSession();
    }

    return Promise.reject(error);
  },
);

export function buildUrl(endpoint: string, params: Record<string, string> = {}) {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, encodeURIComponent(value));
  });
  return url;
}
