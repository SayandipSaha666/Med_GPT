import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_ROUTES } from '../index';
import type { T_UploadedFile } from '../api.types';

export const ALLOWED_MIME_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp', // Modern web image format with better compression
] as const;

export const ACCEPTED_FILE_EXTENSIONS = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp';
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const formatBytes = (bytes: number, decimals = 1): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const getFileCategory = (mime: string): 'image' | 'pdf' | 'doc' | 'text' | 'file' => {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'doc';
  }
  if (mime === 'text/plain') return 'text';
  return 'file';
};

export const fileKeys = {
  all: ['files'] as const,
  detail: (id: string) => ['file', id] as const,
};

/* -------------------- RAW API CALLS -------------------- */

export const uploadFileApi = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<T_UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<T_UploadedFile>(API_ROUTES.UPLOAD_FILE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.(percent);
      }
    },
  });

  return response.data;
};

export const deleteFileApi = async (id: string): Promise<void> => {
  await api.delete(API_ROUTES.DELETE_FILE(id));
};

export const fetchFilesApi = async (): Promise<T_UploadedFile[]> => {
  const response = await api.get<T_UploadedFile[]>(API_ROUTES.FETCH_FILES);
  return response.data;
};

export const fetchFileApi = async (id: string): Promise<T_UploadedFile> => {
  const response = await api.get<T_UploadedFile>(API_ROUTES.FETCH_FILE(id));
  return response.data;
};

/* -------------------- REACT QUERY HOOKS -------------------- */

export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation<T_UploadedFile, Error, { file: File; onProgress?: (p: number) => void }>({
    mutationFn: ({ file, onProgress }) => uploadFileApi(file, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteFileApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
    },
  });
};

export const useFetchFiles = () => {
  return useQuery<T_UploadedFile[], Error>({
    queryKey: fileKeys.all,
    queryFn: fetchFilesApi,
    staleTime: 60 * 1000,
  });
};

export const fileService = {
  uploadFile: uploadFileApi,
  deleteFile: deleteFileApi,
  fetchFiles: fetchFilesApi,
  fetchFile: fetchFileApi,
  useUploadFile,
  useDeleteFile,
  useFetchFiles,
  formatBytes,
  getFileCategory,
  ALLOWED_MIME_TYPES,
  ACCEPTED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
};
