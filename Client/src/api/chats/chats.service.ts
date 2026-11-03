
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, API_ROUTES, API_URL } from '../index';
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

    onSuccess: async (newChat) => {
      // Update the list cache immediately with the new chat object
      queryClient.setQueryData<T_Chat[]>(chatKeys.all, (oldChats) => {
        if (!oldChats) return [newChat];

        return [
          newChat,
          ...oldChats.filter((chat) => chat?.id !== newChat.id),
        ];
      });

      // Reconcile with the server's latest list
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
  fileIds?: string[];
  signal?: AbortSignal;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<
    T_Send_Message_Response,
    Error,
    T_Send_Message_Variables
  >({
    mutationKey: ['sendMessage'],

    mutationFn: async ({ chatId, content, fileIds, signal }) => {
      const response = await api.post<
        T_Api_Success_Res<T_Send_Message_Response>
      >(
        API_ROUTES.SEND_MESSAGE(chatId),
        { content, fileIds },
        {
          signal,
          timeout: 45000,
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

export interface T_Queued_Agent_Task {
  taskId: string;
  userMessage: any;
  assistantMessage: any;
}

export async function createAgentTask(
  chatId: number,
  content: string,
  fileIds: string[],
  signal?: AbortSignal,
): Promise<T_Queued_Agent_Task> {
  const response = await api.post<T_Api_Success_Res<T_Queued_Agent_Task>>(
    API_ROUTES.CREATE_AGENT_TASK(chatId),
    { content, fileIds },
    { signal, timeout: 15_000 },
  );
  return response.data.data;
}

export interface T_Agent_Task_Stream_Event {
  type: 'update' | 'end';
  status?: string;
  progressMessage?: string;
  agentType?: string;
  content?: string;
}

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve) => {
  const finish = () => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', finish);
    resolve();
  };
  const timer = setTimeout(finish, ms);
  signal?.addEventListener('abort', finish, { once: true });
});

export async function streamAgentTask(
  chatId: number,
  taskId: string,
  signal: AbortSignal,
  onEvent: (event: T_Agent_Task_Stream_Event) => void,
): Promise<void> {
  let finished = false;
  while (!finished && !signal.aborted) {
    let retryable = true;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}${API_ROUTES.STREAM_AGENT_TASK(chatId, taskId)}`, {
        method: 'GET',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' } : { Accept: 'text/event-stream' },
        signal,
      });
      if (!response.ok || !response.body) {
        retryable = response.status >= 500 || response.status === 0;
        throw new Error(`Unable to connect to response stream (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (!finished && !signal.aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';
          for (const block of blocks) {
            const dataLine = block.split('\n').find((line) => line.startsWith('data:'));
            if (!dataLine) continue;
            const event = JSON.parse(dataLine.slice(5).trim()) as T_Agent_Task_Stream_Event;
            onEvent(event);
            if (event.type === 'end') finished = true;
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (signal.aborted) return;
      if (!retryable) throw error;
      await wait(1_000, signal);
    }
  }
}

export async function cancelAgentTask(chatId: number, taskId: string): Promise<void> {
  await api.post(API_ROUTES.CANCEL_AGENT_TASK(chatId, taskId));
}

/* -------------------- DELETE MESSAGE -------------------- */

interface T_Delete_Message_Variables {
  chatId: number;
  messageId: number;
}

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { deletedIds: number[] },
    Error,
    T_Delete_Message_Variables
  >({
    mutationKey: ['deleteMessage'],

    mutationFn: async ({ chatId, messageId }) => {
      const response = await api.delete<
        T_Api_Success_Res<{ deletedIds: number[] }>
      >(API_ROUTES.DELETE_MESSAGE(chatId, messageId), {
        timeout: 10000,
      });

      return response.data.data;
    },

    onSuccess: async (_result, { chatId }) => {
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

/* -------------------- EDIT MESSAGE -------------------- */

interface T_Edit_Message_Variables {
  chatId: number;
  messageId: number;
  content: string;
  signal?: AbortSignal;
}

export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { userMessage: any; assistantMessage: any },
    Error,
    T_Edit_Message_Variables
  >({
    mutationKey: ['editMessage'],

    mutationFn: async ({ chatId, messageId, content, signal }) => {
      const response = await api.put<
        T_Api_Success_Res<{ userMessage: any; assistantMessage: any }>
      >(
        API_ROUTES.EDIT_MESSAGE(chatId, messageId),
        { content },
        {
          signal,
          timeout: 45000,
        }
      );

      return response.data.data;
    },

    onSuccess: async (_result, { chatId }) => {
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
  createAgentTask,
  streamAgentTask,
  cancelAgentTask,
  useDeleteMessage,
  useEditMessage,
};
