import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  clearTokens,
  getAccessToken,
  getCsrfToken,
  setAccessToken,
  setCsrfToken,
} from './tokenMemory';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const csrf = getCsrfToken();
  if (csrf && config.headers && ['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    config.headers['X-CSRF-Token'] = csrf;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function refreshSession(): Promise<string | null> {
  try {
    const csrfRes = await axios.get(`${API_URL}/auth/csrf`, { withCredentials: true });
    const csrf = csrfRes.data?.data?.csrfToken as string | undefined;
    if (csrf) setCsrfToken(csrf);

    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: csrf ? { 'X-CSRF-Token': csrf } : {},
      }
    );
    const newAccess: string = data.data.accessToken;
    const newCsrf: string | undefined = data.data.csrfToken;
    setAccessToken(newAccess);
    if (newCsrf) setCsrfToken(newCsrf);
    return newAccess;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const newAccess = await refreshSession();
        if (!newAccess) throw new Error('refresh failed');
        if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`;
        onTokenRefreshed(newAccess);
        return api(original);
      } catch {
        clearTokens();
        const { useAuthStore } = await import('@/store');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message || error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}
