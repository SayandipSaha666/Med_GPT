import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_ROUTES } from '../index';
import { T_Chat, T_Create_Chat_Response, T_Api_Success_Res, T_Send_Message_Response } from '../api.types';

function useFetchChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const timeoutMs = 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await api.get<T_Api_Success_Res<T_Chat[]>>(API_ROUTES.FETCH_CHATS, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    staleTime: 5 * 1000, // 5 seconds
    retry: false,
  });
}

function useFetchChat(chatId: string | number) {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const timeoutMs = 10000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await api.get<T_Api_Success_Res<T_Chat>>(
          API_ROUTES.FETCH_CHAT(chatId),
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    staleTime: 5 * 1000, // 5 seconds
    retry: false,
    enabled: !!chatId,
  });
}

function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['createChat'],
    mutationFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await api.get<T_Create_Chat_Response>(
          API_ROUTES.CREATE_CHAT,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['deleteChat'],
    mutationFn: async (chatId: string | number) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await api.delete<T_Api_Success_Res<null>>(
          API_ROUTES.DELETE_CHAT(chatId),
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    },
  });
}

function useUpdateChatTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateChatTitle'],
    mutationFn: async ({ chatId, title }: { chatId: string | number; title: string }) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await api.put<T_Api_Success_Res<T_Chat>>(
          API_ROUTES.UPDATE_CHAT_TITLE,
          { chatId, title },
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
    },
  });
}

function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sendMessage'],
    mutationFn: async ({ chatId, content }: { chatId: string | number; content: string }) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds for AI response

      try {
        const response = await api.post<T_Send_Message_Response>(
          API_ROUTES.SEND_MESSAGE(chatId),
          { content },
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export const chatService = {
  useFetchChats,
  useFetchChat,
  useCreateChat,
  useDeleteChat,
  useUpdateChatTitle,
  useSendMessage,
};
