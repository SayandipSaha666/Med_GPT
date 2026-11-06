import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { T_Chat, T_FileAttachment, T_Message } from '../api/api.types';
import Message from './Message';
import { PromptInput } from './PromptInput';

interface Props {
  chat: T_Chat | null;
  isLoading: boolean;
  isSending: boolean;
  onSend: (prompt: string, mode: string, attachments?: T_FileAttachment[]) => Promise<boolean>;
  onStop: () => void;
  onEdit: (messageId: number | string, newContent: string) => Promise<void>;
  onDelete: (messageId: number | string) => Promise<void>;
  attachments: T_FileAttachment[];
  onAddFiles: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onRetryAttachment: (id: string) => void;
}

export default function ConversationScreen({ chat, isLoading, isSending, onSend, onStop, onEdit, onDelete, attachments, onAddFiles, onRemoveAttachment, onRetryAttachment }: Props) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat?.messages, isSending]);

  const messages = chat?.messages ?? [];

  return (
    <div className="med-workspace">
      <header className="med-topbar">
        <div className="med-topbar-inner">
          <h1 className="med-topbar-title">{chat?.title || 'Conversation'}</h1>
          <button type="button" className="med-new-link" onClick={() => navigate('/main/chat')} aria-label="New conversation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            New conversation
          </button>
        </div>
      </header>
      <div ref={scrollRef} className="med-scroll-area">
        <div className="med-reading-column">
          {isLoading && !chat ? <div className="med-state" role="status">Loading conversation…</div> : null}
          {!isLoading && messages.length === 0 ? (
            <div className="med-empty med-empty-chat"><h2>Start with a question</h2><p>Ask about health information or attach a document for context.</p></div>
          ) : null}
          <div className="med-message-list" aria-label="Conversation messages">
            {messages.map((message: T_Message, index: number) => (
              <Message key={message.id ?? `pending-${index}`} message={message} onEdit={onEdit} onDelete={onDelete} isSending={isSending} />
            ))}
          </div>
          {isSending && messages.length > 0 && !messages.some((message) => message.role === 'assistant' && ['queued', 'running', 'routing', 'handed_off', 'generating'].includes(String(message.metadata?.generationStatus ?? ''))) && (
            <div className="med-pending" role="status">Preparing the response…</div>
          )}
        </div>
      </div>
      <div className="med-composer-dock">
        <PromptInput loading={isSending} onSend={onSend} onStop={onStop}
          placeholder="Ask a follow-up question or attach a document…"
          attachments={attachments} onAddFiles={onAddFiles} onRemoveAttachment={onRemoveAttachment} onRetryAttachment={onRetryAttachment} />
      </div>
    </div>
  );
}
