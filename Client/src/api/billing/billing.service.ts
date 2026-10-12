import { useMutation, useQuery } from '@tanstack/react-query';
import { api, API_ROUTES } from '../index';
import { T_Plan, T_Api_Success_Res, T_Order_Response, T_Payment_Status } from '../api.types';

function useGetPlans() {
  return useQuery<T_Plan[], Error>({
    queryKey: ['plans'],
    queryFn: async ({ signal }) => {
      const response = await api.get<T_Api_Success_Res<T_Plan[]>>(API_ROUTES.GET_PLANS, {
        signal,
        timeout: 10000,
      });
      return response.data.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: false,
  });
}

function useCreateOrder() {
  return useMutation<T_Order_Response, Error, number>({
    mutationKey: ['createOrder'],
    mutationFn: async (planId: number) => {
      const response = await api.post<T_Api_Success_Res<T_Order_Response>>(
        API_ROUTES.CREATE_ORDER,
        { planId },
        { timeout: 10000 }
      );
      return response.data.data;
    },
  });
}

function usePaymentStatus() {
  return useMutation<T_Payment_Status, Error, string>({
    mutationKey: ['paymentStatus'],
    mutationFn: async (orderId: string) => {
      const response = await api.get<T_Api_Success_Res<T_Payment_Status>>(
        API_ROUTES.PAYMENT_STATUS,
        {
          params: { orderId },
          timeout: 10000,
        }
      );
      return response.data.data;
    },
  });
}

export const billingService = {
  useGetPlans,
  useCreateOrder,
  usePaymentStatus,
};
