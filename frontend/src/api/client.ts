declare module "axios" {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

import axios from "axios";

import { resetAuthStore, useAuthStore } from "../app/store/auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

function getRefreshToken() {
  return useAuthStore.getState().refreshToken;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const token = getRefreshToken();
      if (!token) {
        return null;
      }
      try {
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          },
        );
        const { access_token: accessToken, refresh_token: refreshToken, usuario } = response.data ?? {};
        if (!accessToken || !refreshToken || !usuario) {
          return null;
        }
        useAuthStore.getState().setSession({
          user: usuario,
          accessToken,
          refreshToken,
        });
        return accessToken as string;
      } catch (error) {
        console.error("Unable to refresh token", error);
        resetAuthStore();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config ?? {};
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        };
        return apiClient(originalRequest);
      }
    }
    if (error.response?.status === 401) {
      resetAuthStore();
      window.location.href = "/auth/login";
    }
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);

export type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getErrorMessage(error: unknown, fallback = "Ocurrio un error inesperado") {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    if (payload?.message) {
      return payload.message;
    }
  }
  return fallback;
}
