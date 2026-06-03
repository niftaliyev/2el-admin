import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { getPermissionLabel } from './permissions';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') || process.env.NEXT_PUBLIC_API_URL.endsWith('/api/')
    ? process.env.NEXT_PUBLIC_API_URL
    : `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}/api`)
  : (process.env.NODE_ENV === 'production'
    ? 'http://84.247.184.186:5000/api'
    : 'http://localhost:5156/api');

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      const permission = error.response.data?.permission;
      const permissionLabel = permission ? getPermissionLabel(permission) : '';

      const message = permissionLabel
        ? `Bu əməliyyatı yerinə yetirmək üçün icazəniz yoxdur. (${permissionLabel})`
        : `Bu əməliyyatı yerinə yetirmək üçün icazəniz yoxdur.`;

      toast.error(message);
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storage = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
      const refreshToken = storage.getItem('refreshToken');
      const accessToken = storage.getItem('accessToken');

      if (!refreshToken || !accessToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}/admin/auth/refresh`, {
          accessToken,
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        storage.setItem('accessToken', newAccessToken);
        storage.setItem('refreshToken', newRefreshToken);

        // Update cookie with same persistence as before
        const isPersistent = !!localStorage.getItem('accessToken');
        Cookies.set('accessToken', newAccessToken, { expires: isPersistent ? 30 : undefined });

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        Cookies.remove('accessToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    if (error.response) {
      const data = error.response.data as any;
      let message = 'Bir xəta baş verdi';

      if (data && typeof data === 'object') {
        if (data.errors) {
          message = Object.values(data.errors).flat().join(', ');
          (error as any).validationErrors = data.errors;
        } else {
          message = data.message || data.Message || data.title || data.Title || 'Bir xəta baş verdi';
        }
      } else if (typeof data === 'string') {
        message = data;
      }

      error.message = message;
      if (error.response.data && typeof error.response.data === 'object') {
        error.response.data.message = message;
      }
    } else if (error.request) {
      error.message = 'Serverə qoşulmaq mümkün olmadı';
    }

    return Promise.reject(error);
  }
);

export default api;
