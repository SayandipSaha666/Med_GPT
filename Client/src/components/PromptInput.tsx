import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type DragEvent } from 'react';
import { AttachmentChip, FileUploadButton, validateAndAddFiles } from './FileUpload';
import type { T_FileAttachment } from '../api/api.types';

interface PromptInputProps {
  loading: boolean;
  onSend: (prompt: string, mode: string, attachments?: T_FileAttachment[]) => Promise<boolean | void> | boolean | void;
  onStop?: () => void;
  mode?: string;
  setMode?: (mode: string) => void;
  placeholder?: string;
  suggestion?: string;
  attachments?: T_FileAttachment[];
  onAddFiles?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  onRetryAttachment?: (id: string) => void;
}

export function PromptInput({
  loading, onSend, onStop, mode = 'text', placeholder = 'Ask a health question…', suggestion,
  attachments = [], onAddFiles, onRemoveAttachment, onRetryAttachment,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [prompt]);

  useEffect(() => {
    if (suggestion) {
      setPrompt(suggestion);
      textareaRef.current?.focus();
    }
  }, [suggestion]);

  const isUploading = attachments.some((attachment) => attachment.status === 'uploading');
  const hasReadyFile = attachments.some((attachment) => attachment.status === 'ready');
  const canSend = !loading && !submitting && !isUploading && (Boolean(prompt.trim()) || hasReadyFile);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSend) return;
    const text = prompt.trim() || 'Please analyze these attached medical documents/images.';
    setSubmitting(true);
    try {
      const result = await onSend(text, mode, attachments);
      if (result !== false) setPrompt('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };

  const handleDrop = (event: DragEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (onAddFiles && event.dataTransfer.files.length) validateAndAddFiles(Array.from(event.dataTransfer.files), onAddFiles);
  };

  return (
    <div className="med-composer-wrap">
      <form className={`med-composer ${isDragging ? 'is-dragging' : ''}`} onSubmit={(event) => void submit(event)}
        onDragOver={(event) => { event.preventDefault(); if (onAddFiles) setIsDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false); }}
        onDrop={handleDrop}>
        {isDragging && <div className="med-drop-hint" aria-hidden="true">Drop supported files here</div>}
        {attachments.length > 0 && (
          <div className="med-staged-files" aria-label="Selected attachments">
            {attachments.map((attachment) => <AttachmentChip key={attachment.id} attachment={attachment} onRemove={onRemoveAttachment || (() => {})} onRetry={onRetryAttachment} disabled={loading || submitting} />)}
          </div>
        )}
        <label className="sr-only" htmlFor="med-chat-prompt">Your message</label>
        <textarea id="med-chat-prompt" ref={textareaRef} rows={1} value={prompt}
          onChange={(event) => setPrompt(event.target.value)} onKeyDown={handleKeyDown}
          placeholder={placeholder} disabled={loading || submitting} maxLength={8000} />
        <div className="med-composer-toolbar">
          <div className="med-composer-tools">
            {onAddFiles && <FileUploadButton onAddFiles={onAddFiles} disabled={loading || submitting} />}
            <span>Enter to send · Shift+Enter for a new line</span>
          </div>
          {loading ? (
            <button type="button" className="med-send med-stop" onClick={onStop} aria-label="Stop generating response" title="Stop generating response">
              <span className="med-stop-square" />
            </button>
          ) : (
            <button type="submit" className="med-send" disabled={!canSend} aria-label={isUploading ? 'Uploading attachments' : 'Send message'} title="Send message">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </button>
          )}
        </div>
      </form>
      <p className="med-safety-note">MedGPT provides health information, not a diagnosis. Consult a qualified healthcare professional for medical advice.</p>
    </div>
  );
}

export default PromptInput;
