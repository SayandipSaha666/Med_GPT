import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_ROUTES } from '../index';
import type { T_Api_Success_Res, T_ChatPin } from '../api.types';
import broadcastChannel from '../../lib/broadcastChannel';

export const pinKeys = { all: ['chatPins'] as const };

export const chatPinsService = {
  usePins() {
    return useQuery({
      queryKey: pinKeys.all,
      queryFn: async () => (await api.get<T_Api_Success_Res<T_ChatPin[]>>(API_ROUTES.FETCH_CHAT_PINS)).data.data,
    });
  },
  usePinChat() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (chatId: number) => (await api.put<T_Api_Success_Res<T_ChatPin>>(API_ROUTES.CHAT_PIN(chatId))).data.data,
      onSuccess: (pin) => {
        queryClient.setQueryData<T_ChatPin[]>(pinKeys.all, (old) => old ? [pin, ...old.filter((item) => item.chatId !== pin.chatId)] : [pin]);
        broadcastChannel.sendChatPinned(pin.chatId);
      },
    });
  },
  useUnpinChat() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (chatId: number) => { await api.delete(API_ROUTES.CHAT_PIN(chatId)); return chatId; },
      onSuccess: (chatId) => {
        queryClient.setQueryData<T_ChatPin[]>(pinKeys.all, (old) => old?.filter((item) => item.chatId !== chatId));
        broadcastChannel.sendChatUnpinned(chatId);
      },
    });
  },
};
