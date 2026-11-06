import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import moment from 'moment';
import toast from 'react-hot-toast';
import type { T_Message } from '../api/api.types';
import { formatBytes } from '../api/files/files.service';
import { useFilePreview } from '../store/previewStore';
import { safeExternalUrl, SourceList, withCitationLinks } from './SourceList';

export interface MessageProps {
  message: T_Message;
  onEdit?: (messageId: number | string, newContent: string) => Promise<void> | void;
  onDelete?: (messageId: number | string) => Promise<void> | void;
  isSending?: boolean;
}

function visibleContent(message: T_Message): string {
  const files = message.files ?? [];
  if (!files.length) return message.content;
  let content = message.content;
  for (const file of files) {
    const marker = `[File Attachment: ${file.name}](${file.url})`;
    content = content.replace(marker, '');
  }
  return content.replace(/\n*Attached Medical Documents:\s*$/i, '').trim();
}

function safeContentUrl(value: string): string {
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return safeExternalUrl(value) ?? '';
}

function FileRow({ file }: { file: NonNullable<T_Message['files']>[number] }) {
  const { openPreview } = useFilePreview();
  const status = file.status;
  const url = safeExternalUrl(file.url);
  const canOpen = status === 'READY' && Boolean(url);
  const details = status === 'PROCESSING' ? 'Preparing file' : status === 'FAILED' ? 'Processing failed' : status === 'READY' ? 'Ready' : 'Status unavailable';
  return (
    <button type="button" className="med-file-row" disabled={!canOpen}
      onClick={() => { if (canOpen && url) openPreview({ id: file.id, name: file.name, url, mime: file.mime, sizeBytes: file.sizeBytes }); }}
      aria-label={`${file.name}, ${details}${canOpen ? ', open preview' : ''}`}>
      <span className="med-file-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M8 13h8M8 17h6"/></svg></span>
      <span className="med-file-copy"><strong>{file.name}</strong><small>{file.mime?.split('/').pop()?.toUpperCase() || 'FILE'}{file.sizeBytes ? ` · ${formatBytes(file.sizeBytes)}` : ''} · {details}</small></span>
      {canOpen && <svg aria-hidden="true" className="med-file-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>}
    </button>
  );
}

export default function Message({ message, onEdit, onDelete, isSending = false }: MessageProps) {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const content = visibleContent(message);
  const id = message.id ?? 'pending';
  const status = String(message.metadata?.generationStatus ?? '');
  const isGenerating = ['queued', 'running', 'routing', 'handed_off', 'generating'].includes(status);
  const progress = typeof message.metadata?.progressMessage === 'string' ? message.metadata.progressMessage : '';

  const saveEdit = async () => {
    if (!onEdit || message.id == null || !editValue.trim()) return;
    setIsSaving(true);
    try { await onEdit(message.id, editValue.trim()); setIsEditing(false); }
    finally { setIsSaving(false); }
  };

  const deleteMessage = async () => {
    if (message.id == null || !onDelete || !window.confirm('Delete this message and its assistant response?')) return;
    await onDelete(message.id);
  };

  const copyMessage = async () => {
    try { await navigator.clipboard.writeText(content); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    catch { toast.error('Could not copy this response.'); }
  };

  return (
    <article className={`med-message ${isUser ? 'med-message-user' : 'med-message-assistant'}`} aria-label={isUser ? 'Your message' : 'MedGPT response'}>
      <div className="med-message-identity"><span className="med-message-avatar" aria-hidden="true">{isUser ? 'Y' : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 6v12M6 12h12" /></svg>}</span><span>{isUser ? 'You' : 'MedGPT'}</span>
        {message.timestamp && !Number.isNaN(Date.parse(String(message.timestamp))) && <time dateTime={new Date(message.timestamp).toISOString()}>{moment(message.timestamp).format('h:mm A')}</time>}
      </div>
      <div className="med-message-body">
        {isGenerating && <p className="med-activity" role="status" aria-live="polite"><span className="med-activity-dot" />{progress || 'Preparing the response…'}</p>}
        {status === 'failed' && <p className="med-error" role="alert">The response could not be generated. Your question is saved in this conversation.</p>}
        {isEditing ? (
          <div className="med-edit-panel"><label className="sr-only" htmlFor={`edit-message-${id}`}>Edit your message</label>
            <textarea id={`edit-message-${id}`} value={editValue} onChange={(event) => setEditValue(event.target.value)} rows={4} autoFocus />
            <div><button type="button" onClick={() => { setEditValue(message.content); setIsEditing(false); }} disabled={isSaving}>Cancel</button><button type="button" onClick={() => void saveEdit()} disabled={isSaving || !editValue.trim()}>Save and resubmit</button></div>
          </div>
        ) : message.isImage && safeExternalUrl(content) ? (
          <img className="med-response-image" src={safeExternalUrl(content) ?? undefined} alt="Generated medical graphic" />
        ) : (
          <div className="med-markdown">
            <Markdown remarkPlugins={[remarkGfm]} urlTransform={safeContentUrl} components={{
              p: ({ children }) => <p>{withCitationLinks(children, message.sources, id)}</p>,
              li: ({ children }) => <li>{withCitationLinks(children, message.sources, id)}</li>,
              table: ({ children }) => <div className="med-table-scroll"><table>{children}</table></div>,
              a: ({ href, children }) => href ? <a href={href} target={href.startsWith('/') ? undefined : '_blank'} rel={href.startsWith('/') ? undefined : 'noopener noreferrer'}>{children}</a> : <span>{children}</span>,
            }}>{content}</Markdown>
          </div>
        )}
        {message.files && message.files.length > 0 && <section className="med-message-files" aria-label="Files attached to this message">{message.files.map((file) => <FileRow key={file.id} file={file} />)}</section>}
        {!isUser && <SourceList sources={message.sources} messageId={id} />}
        {!isEditing && <div className="med-message-actions">
          {isUser ? <>
            {onEdit && message.id != null && <button type="button" onClick={() => { setEditValue(content); setIsEditing(true); }} disabled={isSending}>Edit</button>}
            {onDelete && message.id != null && <button type="button" onClick={() => void deleteMessage()} disabled={isSending}>Delete</button>}
          </> : content && <button type="button" onClick={() => void copyMessage()}>{copied ? 'Copied' : 'Copy response'}</button>}
        </div>}
      </div>
    </article>
  );
}
