import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ ? 'http://10.0.2.2:3000/api/v1' : 'https://api.wordpicmemo.com/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];
  public onAuthLost: (() => void) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - attach JWT
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - handle 401 refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const requestUrl = originalRequest?.url || '';

        // Skip token refresh for auth endpoints (login, register, refresh)
        const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh'].some(
          (path) => requestUrl.includes(path),
        );

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            // Backend returns { accessToken, refreshToken } directly
            const newAccess = data.accessToken;
            const newRefresh = data.refreshToken;
            await AsyncStorage.setItem('accessToken', newAccess);
            await AsyncStorage.setItem('refreshToken', newRefresh);

            this.failedQueue.forEach((pending) => pending.resolve(newAccess));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((pending) => pending.reject(refreshError));
            this.failedQueue = [];
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            // Notify auth store to redirect to login
            if (this.onAuthLost) this.onAuthLost();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  get instance() {
    return this.client;
  }
}

const apiClientInstance = new ApiClient();
export const apiClient = apiClientInstance.instance;
export const setOnAuthLost = (callback: () => void) => {
  apiClientInstance.onAuthLost = callback;
};
