import React, { useState, useRef, useEffect } from 'react';
import { AttachmentChip, FileUploadButton, validateAndAddFiles } from './FileUpload';
import type { T_FileAttachment } from '../api/api.types';

interface PromptInputProps {
  loading: boolean;
  onSend: (prompt: string, mode: string, attachments?: T_FileAttachment[]) => void;
  onStop?: () => void;
  mode?: string;
  setMode?: (mode: string) => void;
  placeholder?: string;
  attachments?: T_FileAttachment[];
  onAddFiles?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
}

export function PromptInput({
  loading,
  onSend,
  onStop,
  mode = 'text',
  setMode,
  placeholder = 'Ask anything about symptoms, treatments, medications or attach reports...',
  attachments = [],
  onAddFiles,
  onRemoveAttachment,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [prompt]);

  const isUploadingFiles = attachments.some((att) => att.status === 'uploading');
  const hasReadyFiles = attachments.some((att) => att.status === 'ready');
  const canSubmit = !loading && !isUploadingFiles && (prompt.trim().length > 0 || hasReadyFiles);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) {
      if (onStop) {
        onStop();
      }
      return;
    }
    if (!canSubmit) return;

    const finalPrompt = prompt.trim() || 'Please analyze these attached medical documents/images.';
    onSend(finalPrompt, mode, attachments);
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging && onAddFiles) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only toggle if leaving the outermost element
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (onAddFiles && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      validateAndAddFiles(droppedFiles, onAddFiles);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl
          bg-white/90 dark:bg-[#181527]/90 backdrop-blur-xl
          border
          ${isDragging
            ? 'border-dashed border-2 border-purple-500 bg-purple-50/50 dark:bg-purple-950/30'
            : 'border-purple-200/80 dark:border-purple-900/60'
          }
          shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10 dark:shadow-black/40
          focus-within:border-purple-500 dark:focus-within:border-purple-400
          focus-within:ring-4 focus-within:ring-purple-500/10
          transition-all duration-200 p-2 sm:p-3
        `}
      >
        {/* Drag Overlay Notice */}
        {isDragging && (
          <div className="absolute inset-0 z-20 rounded-2xl bg-white/95 dark:bg-[#181527]/95 flex flex-col items-center justify-center pointer-events-none border-2 border-dashed border-purple-500 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Drop medical files here (PDF, DOCX, PNG, JPG)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Multiple files supported up to 10MB each
            </p>
          </div>
        )}

        {/* Attached Files Staging Area */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-2 border-b border-purple-100/80 dark:border-purple-950/50 scrollbar-thin">
            {attachments.map((att) => (
              <AttachmentChip
                key={att.id}
                attachment={att}
                onRemove={onRemoveAttachment || (() => { })}
                disabled={loading}
              />
            ))}
          </div>
        )}

        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* File Upload Attachment Trigger Button */}
          {onAddFiles && (
            <FileUploadButton
              onAddFiles={onAddFiles}
              disabled={loading}
            />
          )}

          {/* Medical Pulse Indicator / Icon */}
          <div className="p-2 hidden sm:flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>

          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading}
            className="
              flex-1 w-full max-h-40 min-h-[24px] py-1.5 px-2
              text-sm text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              bg-transparent outline-none resize-none
              disabled:opacity-50 scrollbar-thin
            "
          />

          {/* Send / Stop Button */}
          <button
            type={loading ? "button" : "submit"}
            onClick={loading ? onStop : undefined}
            disabled={!loading && !canSubmit}
            className={`
              p-2.5 rounded-xl flex items-center justify-center
              transition-all duration-200 shrink-0 cursor-pointer
              ${loading
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-md shadow-rose-500/30 animate-pulse'
                : canSubmit
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-500/25 hover:scale-105 active:scale-95'
                  : 'bg-gray-100 dark:bg-purple-950/40 text-gray-400 dark:text-gray-500 !cursor-not-allowed'
              }
            `}
            title={
              loading
                ? 'Stop generating response'
                : isUploadingFiles
                  ? 'Uploading attachments...'
                  : 'Send message (Enter)'
            }
            aria-label={loading ? 'Stop generating' : 'Send message'}
          >
            {loading ? (
              /* Stop Square Icon */
              <div className="flex items-center justify-center w-4 h-4">
                <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
              </div>
            ) : isUploadingFiles ? (
              <svg className="animate-spin h-4 w-4 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 transform rotate-45 -mr-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>

        {/* Helper footer inside prompt input */}
        <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-100/80 dark:border-purple-950/40 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              MedGPT v2.0
            </span>
            <span className="hidden sm:inline opacity-60">• Shift+Enter for new line</span>
            {attachments.length > 0 && (
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                • {attachments.length} file{attachments.length > 1 ? 's' : ''} attached
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {setMode && (
              <button
                type="button"
                onClick={() => setMode(mode === 'text' ? 'research' : 'text')}
                className="text-[11px] px-2 py-0.5 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 transition-colors cursor-pointer"
              >
                Mode: <span className="font-semibold capitalize">{mode}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Safety Disclaimer */}
      <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 mt-2 px-4">
        MedGPT is an AI assistant for health information. Always consult a qualified healthcare professional for medical diagnoses.
      </p>
    </div>
  );
}

export default PromptInput;
