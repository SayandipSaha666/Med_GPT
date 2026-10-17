import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ALLOWED_MIME_TYPES,
  ACCEPTED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  formatBytes,
  getFileCategory,
} from '../api/files/files.service';
import type { T_FileAttachment } from '../api/api.types';
import { useFilePreview } from '../store/previewStore';

export interface FileUploadProps {
  attachments: T_FileAttachment[];
  onAddFiles: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  disabled?: boolean;
}

export function FileIcon({ mime }: { mime: string }) {
  const category = getFileCategory(mime);

  if (category === 'image') {
    return (
      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (category === 'pdf') {
    return (
      <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (category === 'doc') {
    return (
      <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
  );
}

export function AttachmentChip({
  attachment,
  onRemove,
  disabled,
}: {
  attachment: T_FileAttachment;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const { openPreview } = useFilePreview();
  const isImage = attachment.mime.startsWith('image/');
  const effectiveUrl = attachment.url || (attachment.file ? URL.createObjectURL(attachment.file) : '');

  const handleChipClick = () => {
    if (!effectiveUrl) return;
    openPreview({
      id: attachment.id,
      name: attachment.name,
      url: effectiveUrl,
      mime: attachment.mime,
      sizeBytes: attachment.sizeBytes,
      file: attachment.file,
    });
  };

  return (
    <div
      onClick={handleChipClick}
      className={`
        group relative flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl
        bg-purple-50/70 dark:bg-[#201c34]/70 border
        ${attachment.status === 'error'
          ? 'border-red-300 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20'
          : 'border-purple-200/80 dark:border-purple-800/40 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-white dark:hover:bg-[#28243e]'
        }
        shadow-xs transition-all duration-200 animate-fade-in max-w-xs cursor-pointer
      `}
      title="Click to preview file"
    >
      {/* Thumbnail or File Icon */}
      {isImage && effectiveUrl ? (
        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-purple-200/50 dark:border-purple-800/50 bg-gray-100 dark:bg-gray-800">
          <img
            src={effectiveUrl}
            alt={attachment.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <FileIcon mime={attachment.mime} />
      )}

      {/* Info */}
      <div className="flex flex-col min-w-0 pr-1">
        <span
          className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[140px] sm:max-w-[180px] group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors"
          title={attachment.name}
        >
          {attachment.name}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-400 font-medium">
          <span>{formatBytes(attachment.sizeBytes)}</span>

          {attachment.status === 'uploading' && (
            <span className="text-purple-600 dark:text-purple-400 font-semibold animate-pulse">
              • {attachment.progress}%
            </span>
          )}

          {attachment.status === 'ready' && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              • Uploaded
            </span>
          )}

          {attachment.status === 'error' && (
            <span className="text-red-500 dark:text-red-400 font-semibold truncate max-w-[100px]">
              • {attachment.error || 'Failed'}
            </span>
          )}
        </div>
      </div>

      {/* Progress Spinner or Delete Button */}
      <div className="ml-auto shrink-0 flex items-center">
        {attachment.status === 'uploading' ? (
          <div className="w-5 h-5 flex items-center justify-center">
            <svg className="animate-spin w-4 h-4 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(attachment.id);
            }}
            className="
              p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50
              dark:hover:text-red-400 dark:hover:bg-red-950/40
              transition-colors duration-150 cursor-pointer disabled:opacity-40
            "
            title="Remove file"
            aria-label="Remove attachment"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function FileUploadButton({
  onAddFiles,
  disabled,
  className = '',
}: {
  onAddFiles: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    validateAndAddFiles(files, onAddFiles);

    // Reset input so user can choose the same file again if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        className={`
          p-2 rounded-xl text-gray-500 hover:text-purple-600
          dark:text-gray-400 dark:hover:text-purple-300
          hover:bg-purple-50 dark:hover:bg-purple-950/50
          transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center shrink-0
          ${className}
        `}
        title="Attach medical reports, lab tests or images (multiple allowed)"
        aria-label="Attach files"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>
    </>
  );
}

export function validateAndAddFiles(files: File[], onAddFiles: (validFiles: File[]) => void) {
  const validFiles: File[] = [];

  for (const file of files) {
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      continue;
    }

    // Check file mime type (or fallback to extension for edge-cases)
    const isMimeAllowed = (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isExtAllowed = ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');

    if (!isMimeAllowed && !isExtAllowed) {
      toast.error(`"${file.name}" is not a supported format. Use PDF, Word, TXT, or images (PNG, JPG, GIF, WEBP).`);
      continue;
    }

    validFiles.push(file);
  }

  if (validFiles.length > 0) {
    onAddFiles(validFiles);
  }
}
