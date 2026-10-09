import { useMutation, useQuery } from '@tanstack/react-query';
import { api, API_ROUTES } from '../index';
import { T_Login_Credentials, T_Register_Data, T_User, T_Api_Success_Res } from '../api.types';

function useLogin() {
  return useMutation({
    mutationKey: ['login'],
    mutationFn: async (credentials: T_Login_Credentials) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await api.post<T_Api_Success_Res<{ accessToken: string; user: T_User }>>(
          API_ROUTES.LOGIN,
          credentials,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.data.success) {
          // Store token if returned
          if (response.data.data.accessToken) {
            localStorage.setItem('accessToken', response.data.data.accessToken);
          }
          return response.data;
        }
        throw new Error(response.data.message || 'Login failed');
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
  });
}

function useRegister() {
  return useMutation({
    mutationKey: ['register'],
    mutationFn: async (data: T_Register_Data) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await api.post<T_Api_Success_Res<{ accessToken: string; user: T_User }>>(
          API_ROUTES.REGISTER,
          data,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.data.success) {
          if (response.data.data.accessToken) {
            localStorage.setItem('accessToken', response.data.data.accessToken);
          }
          return response.data;
        }
        throw new Error(response.data.message || 'Registration failed');
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
  });
}

function useLogout() {
  return useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await api.post<T_Api_Success_Res<null>>(
          API_ROUTES.LOGOUT,
          {},
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.data.success) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
  });
}

function useGetMe() {
  return useQuery({
    queryKey: ['getMe'],
    queryFn: async () => {
      const timeoutMs = 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await api.get<T_Api_Success_Res<T_User>>(
          API_ROUTES.GET_ME,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!localStorage.getItem('accessToken'), // Only run if there's a token
    retry: false,
  });
}

function useRefreshToken() {
  return useMutation({
    mutationKey: ['refreshToken'],
    mutationFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await api.post<T_Api_Success_Res<{ accessToken: string }>>(
          API_ROUTES.REFRESH_TOKEN,
          {},
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (response.data.success) {
          localStorage.setItem('accessToken', response.data.data.accessToken);
          return response.data.data.accessToken;
        }
        throw new Error(response.data.message || 'Token refresh failed');
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
  });
}

export const authService = {
  useLogin,
  useRegister,
  useLogout,
  useGetMe,
  useRefreshToken,
};
