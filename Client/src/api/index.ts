import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { queryClient } from './queryClient';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export const API_ROUTES = {
  // Auth routes
  LOGIN: '/api/user/login',
  REGISTER: '/api/user/register',
  LOGOUT: '/api/user/logout',
  GET_ME: '/api/user/auth',
  REFRESH_TOKEN: '/api/user/refresh',
  UPDATE_PROFILE: '/api/user/profile',

  // Chat routes
  CREATE_CHAT: '/api/chat/create',
  FETCH_CHATS: '/api/chat/all',
  FETCH_CHAT: (chatId: string | number) => `/api/chat/${chatId}`,
  DELETE_CHAT: (chatId: string | number) => `/api/chat/${chatId}`,
  UPDATE_CHAT_TITLE: '/api/chat/update',
  SEND_MESSAGE: (chatId: string | number) => `/api/chat/${chatId}/message`,

  // Billing routes
  GET_PLANS: '/api/billing/plans',
  CREATE_ORDER: '/api/billing/create-order',
  PAYMENT_STATUS: '/api/billing/payment-status',
};

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 3 * 60 * 1000, // 3 minutes
  withCredentials: true,
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Check for token in localStorage (for client-side token storage)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err) => {
    const originalRequest = err.config;

    // Handle 401 errors
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      try {
        const response = await axios.post(`${API_URL}${API_ROUTES.REFRESH_TOKEN}`, {}, {
          withCredentials: true,
        });

        if (response.data.success) {
          const newAccessToken = response.data.data.accessToken;
          localStorage.setItem('accessToken', newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return await api(originalRequest);
        }
      } catch (refreshError) {
        // Clear tokens and redirect to auth on refresh failure
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth';
        queryClient.clear();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  },
);

export { api, API_URL };
