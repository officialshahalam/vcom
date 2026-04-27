import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "../constants";
import { tokenStorage } from "./tokenStorage";

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const shouldSkipRefresh = (url?: string): boolean => {
  if (!url) return false;

  return [
    "/auth/login",
    "/auth/signup",
    "/auth/verify-otp",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/refresh-token",
  ].some((authPath) => url.includes(authPath));
};

const processQueue = (token: string | null): void => {
  pendingQueue.forEach((callback) => callback(token));
  pendingQueue = [];
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const accessToken = await tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest?._retry || shouldSkipRefresh(originalRequest?.url)) {
      throw error;
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) throw error;

      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
      const nextAccessToken = response.data?.data?.accessToken as string;
      const currentRefreshToken = refreshToken;
      await tokenStorage.setTokens(nextAccessToken, currentRefreshToken);
      processQueue(nextAccessToken);

      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      await tokenStorage.clear();
      processQueue(null);
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  },
);
