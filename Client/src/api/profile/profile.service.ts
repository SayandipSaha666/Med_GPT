import { useMutation, useQuery } from '@tanstack/react-query';
import { api, API_ROUTES } from '../index';
import { T_Api_Success_Res, T_Update_Profile_Data, T_User } from '../api.types';

function useUpdateProfile() {
  return useMutation({
    mutationKey: ['updateProfile'],
    mutationFn: async (data: T_Update_Profile_Data) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await api.put<T_Api_Success_Res<{ name: string }>>(
          API_ROUTES.UPDATE_PROFILE,
          data,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
  });
}

export const profileService = {
  useUpdateProfile,
};
