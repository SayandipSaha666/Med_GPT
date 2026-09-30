import { useMutation, useQuery } from '@tanstack/react-query';
import { api, API_ROUTES } from '../index';
import { T_Plan, T_Api_Success_Res, T_Order_Response, T_Payment_Status } from '../api.types';

function useGetPlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const timeoutMs = 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await api.get<T_Api_Success_Res<T_Plan[]>>(API_ROUTES.GET_PLANS, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: false,
  });
}

function useCreateOrder() {
  return useMutation({
    mutationKey: ['createOrder'],
    mutationFn: async (planId: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await api.post<T_Api_Success_Res<T_Order_Response>>(
          API_ROUTES.CREATE_ORDER,
          { planId },
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

function usePaymentStatus() {
  return useQuery({
    queryKey: ['paymentStatus'],
    queryFn: async ({ orderId }: { orderId: string }) => {
      const timeoutMs = 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await api.get<T_Api_Success_Res<T_Payment_Status>>(
          API_ROUTES.PAYMENT_STATUS,
          {
            signal: controller.signal,
            params: { orderId },
          }
        );
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    enabled: false, // Only run when explicitly called
    retry: false,
  });
}

export const billingService = {
  useGetPlans,
  useCreateOrder,
  usePaymentStatus,
};
