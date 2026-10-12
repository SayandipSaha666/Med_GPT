import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ApiService } from '../api/api.service';
import type { T_FileAttachment } from '../api/api.types';

export function useChatAttachments() {
  const [attachments, setAttachments] = useState<T_FileAttachment[]>([]);

  const addFiles = useCallback((files: File[]) => {
    if (!files || files.length === 0) return;

    files.forEach((file) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const newAttachment: T_FileAttachment = {
        id: tempId,
        name: file.name,
        sizeBytes: file.size,
        mime: file.type || 'application/octet-stream',
        status: 'uploading',
        progress: 0,
        file,
      };

      setAttachments((prev) => [...prev, newAttachment]);

      // Upload file to server/Cloudinary
      ApiService.files
        .uploadFile(file, (percent) => {
          setAttachments((prev) =>
            prev.map((att) =>
              att.id === tempId ? { ...att, progress: percent } : att
            )
          );
        })
        .then((uploaded) => {
          setAttachments((prev) =>
            prev.map((att) =>
              att.id === tempId
                ? {
                  ...att,
                  id: uploaded.id,
                  url: uploaded.url,
                  mime: uploaded.mime,
                  name: uploaded.name,
                  sizeBytes: uploaded.sizeBytes,
                  status: 'ready',
                  progress: 100,
                }
                : att
            )
          );
          toast.success(`Attached "${file.name}" 📎`);
        })
        .catch((err: any) => {
          const errMsg = err?.response?.data?.message || err?.message || 'Upload failed';
          setAttachments((prev) =>
            prev.map((att) =>
              att.id === tempId
                ? {
                  ...att,
                  status: 'error',
                  error: errMsg,
                }
                : att
            )
          );
          toast.error(`Failed to upload "${file.name}": ${errMsg}`);
        });
    });
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((att) => att.id === id);
      // If file was already saved to backend, delete from Cloudinary & DB in background
      if (target && target.status === 'ready' && !target.id.startsWith('temp_')) {
        ApiService.files.deleteFile(target.id).catch(() => { });
      }
      return prev.filter((att) => att.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const readyAttachments = attachments.filter((att) => att.status === 'ready' && !!att.url);
  const isUploading = attachments.some((att) => att.status === 'uploading');

  return {
    attachments,
    readyAttachments,
    isUploading,
    addFiles,
    removeAttachment,
    clearAttachments,
  };
}
