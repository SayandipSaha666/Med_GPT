import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_ROUTES } from '../index';
import type { T_Api_Success_Res, T_ChatFolder } from '../api.types';
import broadcastChannel from '../../lib/broadcastChannel';

export const folderKeys = { all: ['chatFolders'] as const };
type FolderInput = { name: string; icon?: string; color?: string };
type Assignment = { folderId: number; chatId: number };

export const chatFoldersService = {
  useFolders() {
    return useQuery({
      queryKey: folderKeys.all,
      queryFn: async () => (await api.get<T_Api_Success_Res<T_ChatFolder[]>>(API_ROUTES.FETCH_CHAT_FOLDERS)).data.data,
    });
  },
  useCreateFolder() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (input: FolderInput) => (await api.post<T_Api_Success_Res<T_ChatFolder>>(API_ROUTES.FETCH_CHAT_FOLDERS, input)).data.data,
      onSuccess: (folder) => { queryClient.setQueryData<T_ChatFolder[]>(folderKeys.all, (old) => [...(old ?? []), folder]); broadcastChannel.sendFoldersChanged(); },
    });
  },
  useUpdateFolder() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ folderId, ...input }: FolderInput & { folderId: number }) =>
        (await api.put<T_Api_Success_Res<T_ChatFolder>>(API_ROUTES.CHAT_FOLDER(folderId), input)).data.data,
      onSuccess: (folder) => { queryClient.setQueryData<T_ChatFolder[]>(folderKeys.all, (old) => old?.map((item) => item.id === folder.id ? folder : item)); broadcastChannel.sendFoldersChanged(); },
    });
  },
  useDeleteFolder() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (folderId: number) => { await api.delete(API_ROUTES.CHAT_FOLDER(folderId)); return folderId; },
      onSuccess: (folderId) => { queryClient.setQueryData<T_ChatFolder[]>(folderKeys.all, (old) => old?.filter((folder) => folder.id !== folderId)); broadcastChannel.sendFoldersChanged(); },
    });
  },
  useAddChat() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ folderId, chatId }: Assignment) =>
        (await api.put<T_Api_Success_Res<T_ChatFolder>>(API_ROUTES.CHAT_FOLDER_CHAT(folderId, chatId))).data.data,
      onSuccess: (folder, { chatId }) => { queryClient.setQueryData<T_ChatFolder[]>(folderKeys.all, (old) => old?.map((item) => item.id === folder.id ? folder : item)); broadcastChannel.sendChatMovedToFolder(chatId, folder.id); },
    });
  },
  useRemoveChat() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ folderId, chatId }: Assignment) =>
        (await api.delete<T_Api_Success_Res<T_ChatFolder>>(API_ROUTES.CHAT_FOLDER_CHAT(folderId, chatId))).data.data,
      onSuccess: (folder) => { queryClient.setQueryData<T_ChatFolder[]>(folderKeys.all, (old) => old?.map((item) => item.id === folder.id ? folder : item)); broadcastChannel.sendFoldersChanged(); },
    });
  },
};
