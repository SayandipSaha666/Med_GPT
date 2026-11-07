import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { T_Chat, T_FileAttachment, T_Message } from '../api/api.types';
import Message from './Message';
import { PromptInput } from './PromptInput';
import { KnowledgeResources, SourceList, validResources, validSources } from './SourceList';

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
  const resourcesButtonRef = useRef<HTMLButtonElement>(null);
  const closeResourcesRef = useRef<HTMLButtonElement>(null);
  const [selectedResponseId, setSelectedResponseId] = useState<number | string | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat?.messages, isSending]);

  useEffect(() => {
    if (!resourcesOpen) return;
    closeResourcesRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setResourcesOpen(false);
        resourcesButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [resourcesOpen]);

  const messages = chat?.messages ?? [];
  const responses = messages.filter((message) => message.role === 'assistant' && (validResources(message.resources).length > 0 || validSources(message.sources).length > 0));
  const selectedResponse = responses.find((message) => String(message.id) === String(selectedResponseId)) ?? responses[responses.length - 1];

  return (
    <div className="med-workspace">
      <header className="med-topbar">
        <div className="med-topbar-inner">
          <h1 className="med-topbar-title">{chat?.title || 'Conversation'}</h1>
          <button type="button" className="med-new-link" onClick={() => navigate('/main/chat')} aria-label="New conversation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            New conversation
          </button>
          <button ref={resourcesButtonRef} type="button" className="med-resources-toggle" onClick={() => setResourcesOpen((open) => !open)} aria-controls="med-resources-panel" aria-expanded={resourcesOpen}>
            Resources{responses.length > 0 ? ` (${validResources(selectedResponse?.resources).length + validSources(selectedResponse?.sources).length})` : ''}
          </button>
        </div>
      </header>
      <div className="med-conversation-row">
      <div ref={scrollRef} className="med-scroll-area">
        <div className="med-reading-column">
          {isLoading && !chat ? <div className="med-state" role="status">Loading conversation…</div> : null}
          {!isLoading && messages.length === 0 ? (
            <div className="med-empty med-empty-chat"><h2>Start with a question</h2><p>Ask about health information or attach a document for context.</p></div>
          ) : null}
          <div className="med-message-list" aria-label="Conversation messages">
            {messages.map((message: T_Message, index: number) => (
              <Message key={message.id ?? `pending-${index}`} message={message} onEdit={onEdit} onDelete={onDelete} isSending={isSending}
                onOpenResources={() => { setSelectedResponseId(message.id ?? null); setResourcesOpen(true); }} />
            ))}
          </div>
          {isSending && messages.length > 0 && !messages.some((message) => message.role === 'assistant' && ['queued', 'running', 'routing', 'handed_off', 'generating'].includes(String(message.metadata?.generationStatus ?? ''))) && (
            <div className="med-pending" role="status">Preparing the response…</div>
          )}
        </div>
      </div>
      <aside id="med-resources-panel" className={`med-resources-panel ${resourcesOpen ? 'is-open' : ''}`} aria-label="Resources for the selected response">
        <div className="med-resources-heading"><h2>Resources</h2><button ref={closeResourcesRef} type="button" onClick={() => { setResourcesOpen(false); resourcesButtonRef.current?.focus(); }} aria-label="Close resources panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" /></svg></button></div>
        {responses.length > 1 && <label className="med-resource-select-label">Response
          <select value={String(selectedResponse?.id ?? '')} onChange={(event) => setSelectedResponseId(event.target.value)} aria-label="Choose response resources">
            {responses.map((response, index) => <option key={String(response.id)} value={String(response.id)}>Response {index + 1}{response.timestamp ? ` · ${new Date(response.timestamp).toLocaleDateString()}` : ''}</option>)}
          </select>
        </label>}
        {selectedResponse ? <><a className="med-resource-jump" href={`#message-${selectedResponse.id}`} onClick={() => setResourcesOpen(false)}>Go to response ↑</a><KnowledgeResources resources={selectedResponse.resources} messageId={selectedResponse.id ?? 'pending'} compact /><SourceList sources={selectedResponse.sources} messageId={`panel-${selectedResponse.id ?? 'pending'}`} /></> : <p className="med-resource-empty">Resources used in a response will appear here when recorded.</p>}
      </aside>
      </div>
      <div className="med-composer-dock">
        <PromptInput loading={isSending} onSend={onSend} onStop={onStop}
          placeholder="Ask a follow-up question or attach a document…"
          attachments={attachments} onAddFiles={onAddFiles} onRemoveAttachment={onRemoveAttachment} onRetryAttachment={onRetryAttachment} />
      </div>
    </div>
  );
}
