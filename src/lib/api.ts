import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000, // 45s — covers Render free-tier cold start (~30s)
});

// Request interceptor — attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh token on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // ─── Only attempt refresh on 401 (Unauthorized) ───────────────────────────
    // Do NOT logout on network errors (ECONNABORTED, ERR_NETWORK) — these happen
    // during Render cold starts. Only a genuine 401 means the session is invalid.
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, updateTokens, clearAuth } = useAuthStore.getState();

      if (!refreshToken) {
        isRefreshing = false;
        clearAuth();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Use a dedicated axios instance with a long timeout for the refresh call
        // so Render cold-start delays don't abort it
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken }, {
          timeout: 60000, // 60s — give Render plenty of time to wake up
        });
        updateTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError as AxiosError, null);

        // ─── Only clear session on definitive auth failures ───────────────────
        // If the refresh call itself got a network error (Render still waking),
        // don't logout — just reject so the UI shows an error toast instead.
        const isAuthFailure =
          refreshError?.response?.status === 401 ||
          refreshError?.response?.status === 403;

        if (isAuthFailure) {
          clearAuth();
          if (typeof window !== 'undefined') window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
