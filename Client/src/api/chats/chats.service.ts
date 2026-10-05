
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, API_ROUTES } from '../index';
import {
  T_Chat,
  T_Create_Chat_Response,
  T_Api_Success_Res,
  T_Send_Message_Response,
} from '../api.types';

/**
 * Centralized query keys.
 * Keep these consistent wherever chat queries are used.
 */
export const chatKeys = {
  all: ['chats'] as const,
  detail: (chatId: number) => ['chat', chatId] as const,
};

/**
 * Extract the actual payload from the API response envelope.
 *
 * Expected response:
 * {
 *   success: true,
 *   message?: string,
 *   data: ...
 * }
 */

/* -------------------- FETCH ALL CHATS -------------------- */

export const useFetchChats = () => {
  return useQuery<T_Chat[], Error>({
    queryKey: chatKeys.all,

    queryFn: async ({ signal }) => {
      const response = await api.get<T_Api_Success_Res<T_Chat[]>>(
        API_ROUTES.FETCH_CHATS,
        {
          signal,
          timeout: 10000,
        }
      );

      return response.data.data;
    },

    staleTime: 30 * 1000,
    retry: false,
  });
};

/* -------------------- FETCH SINGLE CHAT -------------------- */

export const useFetchChat = (chatId: number | null | undefined) => {
  return useQuery<T_Chat, Error>({
    queryKey:
      chatId != null ? chatKeys.detail(chatId) : ['chat', null],

    queryFn: async ({ signal }) => {
      if (chatId == null) {
        throw new Error('Chat ID is required');
      }

      const response = await api.get<T_Api_Success_Res<T_Chat>>(
        API_ROUTES.FETCH_CHAT(chatId),
        {
          signal,
          timeout: 10000,
        }
      );

      return response.data.data;
    },

    enabled: chatId != null,
    staleTime: 30 * 1000,
    retry: false,
  });
};

/* -------------------- CREATE CHAT -------------------- */

export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation<
    T_Create_Chat_Response,
    Error,
    { title?: string }
  >({
    mutationKey: ['createChat'],

    mutationFn: async ({ title }) => {
      const payload = title ? { title } : {};

      const response = await api.post<
        T_Api_Success_Res<T_Create_Chat_Response>
      >(API_ROUTES.CREATE_CHAT, payload, {
        timeout: 10000,
      });

      return response.data.data;
    },

    onSuccess: async (result) => {
      // Update the list cache immediately.
      queryClient.setQueryData<T_Chat[]>(chatKeys.all, (oldChats) => {
        if (!oldChats) return [result.chat];

        // Prevent duplicate entries if the chat is already cached.
        return [
          result.chat,
          ...oldChats.filter((chat) => chat.id !== result.chat.id),
        ];
      });

      // Reconcile with the server's latest list.
      await queryClient.invalidateQueries({
        queryKey: chatKeys.all,
      });
    },
  });
};

/* -------------------- DELETE CHAT -------------------- */

export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, number>({
    mutationKey: ['deleteChat'],

    mutationFn: async (chatId) => {
      const response = await api.delete<T_Api_Success_Res<unknown>>(
        API_ROUTES.DELETE_CHAT(chatId),
        {
          timeout: 10000,
        }
      );

      return response.data.data;
    },

    onSuccess: async (_result, chatId) => {
      // Remove the deleted chat from the cached list.
      queryClient.setQueryData<T_Chat[]>(chatKeys.all, (oldChats) => {
        if (!oldChats) return oldChats;

        return oldChats.filter((chat) => chat.id !== chatId);
      });

      // Remove the deleted chat's detail cache.
      queryClient.removeQueries({
        queryKey: chatKeys.detail(chatId),
        exact: true,
      });

      // Reconcile the list with the backend.
      await queryClient.invalidateQueries({
        queryKey: chatKeys.all,
      });
    },
  });
};

/* -------------------- UPDATE CHAT TITLE -------------------- */

interface T_Update_Chat_Title_Variables {
  chatId: number;
  title: string;
}

export const useUpdateChatTitle = () => {
  const queryClient = useQueryClient();

  return useMutation<
    unknown,
    Error,
    T_Update_Chat_Title_Variables
  >({
    mutationKey: ['updateChatTitle'],

    mutationFn: async ({ chatId, title }) => {
      const response = await api.put<T_Api_Success_Res<unknown>>(
        API_ROUTES.UPDATE_CHAT_TITLE(chatId),
        { title },
        {
          timeout: 10000,
        }
      );

      return response.data.data;
    },

    onSuccess: async (_result, { chatId, title }) => {
      // Update the title in the cached chat list.
      queryClient.setQueryData<T_Chat[]>(chatKeys.all, (oldChats) => {
        if (!oldChats) return oldChats;

        return oldChats.map((chat) =>
          chat.id === chatId
            ? { ...chat, title, updatedAt: new Date().toISOString() }
            : chat
        );
      });

      // Update the detail cache if it is already present.
      queryClient.setQueryData<T_Chat>(
        chatKeys.detail(chatId),
        (oldChat) =>
          oldChat
            ? {
                ...oldChat,
                title,
                updatedAt: new Date().toISOString(),
              }
            : oldChat
      );

      // Reconcile the affected queries with the backend.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: chatKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: chatKeys.detail(chatId),
        }),
      ]);
    },
  });
};

/* -------------------- SEND MESSAGE -------------------- */

interface T_Send_Message_Variables {
  chatId: number;
  content: string;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<
    T_Send_Message_Response,
    Error,
    T_Send_Message_Variables
  >({
    mutationKey: ['sendMessage'],

    mutationFn: async ({ chatId, content }) => {
      const response = await api.post<
        T_Api_Success_Res<T_Send_Message_Response>
      >(
        API_ROUTES.SEND_MESSAGE(chatId),
        { content },
        {
          timeout: 30000,
        }
      );

      return response.data.data;
    },

    onSuccess: async (_result, { chatId }) => {
      // The server may update messages, title, and updatedAt.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: chatKeys.detail(chatId),
        }),
        queryClient.invalidateQueries({
          queryKey: chatKeys.all,
        }),
      ]);
    },
  });
};

/* -------------------- SERVICE EXPORT -------------------- */

export const chatService = {
  useFetchChats,
  useFetchChat,
  useCreateChat,
  useDeleteChat,
  useUpdateChatTitle,
  useSendMessage,
};
