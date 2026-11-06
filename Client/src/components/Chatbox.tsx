import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../api/api.service';
import { useChatAttachments } from '../hooks/useChatAttachments';
import type { T_FileAttachment } from '../api/api.types';
import { PromptInput } from './PromptInput';
import toast from 'react-hot-toast';

const prompts = [
  { title: 'Understand a lab result', text: 'What does a high neutrophil count in a complete blood count mean?' },
  { title: 'Ask about medicines', text: 'What should I ask a clinician before taking ibuprofen with paracetamol?' },
  { title: 'Prepare for an appointment', text: 'How can I organize symptoms and questions before a doctor visit?' },
];

export default function Chatbox() {
  const navigate = useNavigate();
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const draftChatIdRef = useRef<number | null>(null);
  const { attachments, addFiles, removeAttachment, retryAttachment, clearAttachments } = useChatAttachments();
  const createChat = ApiService.chats.useCreateChat();
  const sendMessage = ApiService.chats.useSendMessage();

  const handleSend = useCallback(async (prompt: string, _mode: string, currentAttachments?: T_FileAttachment[]): Promise<boolean> => {
    const readyFiles = (currentAttachments ?? attachments).filter((item) => item.status === 'ready' && item.url);
    if (!prompt.trim() && readyFiles.length === 0) return false;
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const title = prompt.trim() ? `${prompt.trim().slice(0, 55)}${prompt.trim().length > 55 ? '…' : ''}` : `Review ${readyFiles[0].name}`;
      const chatId = draftChatIdRef.current ?? (await createChat.mutateAsync({ title })).id;
      draftChatIdRef.current = chatId;
      const fileContext = readyFiles.map((file) => `[File Attachment: ${file.name}](${file.url})`).join('\n');
      const content = fileContext ? `${prompt}\n\nAttached Medical Documents:\n${fileContext}` : prompt;
      await sendMessage.mutateAsync({ chatId, content, fileIds: readyFiles.map((file) => file.id), signal: controller.signal });
      clearAttachments();
      draftChatIdRef.current = null;
      navigate(`/main/chat/${chatId}`);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not send your message. Try again.';
      if (!controller.signal.aborted) toast.error(message);
      return false;
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [attachments, clearAttachments, createChat, navigate, sendMessage]);

  return (
    <div className="med-workspace">
      <header className="med-topbar">
        <div className="med-topbar-inner"><span className="med-topbar-title">New conversation</span><span className="med-topbar-context">Health research workspace</span></div>
      </header>
      <div className="med-scroll-area med-empty-scroll">
        <section className="med-empty" aria-labelledby="med-welcome-heading">
          <div className="med-empty-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></div>
          <h1 id="med-welcome-heading">What would you like to understand?</h1>
          <p>Explore health questions, make sense of medical information, or add a document for context. MedGPT helps you prepare for a more informed conversation with a clinician.</p>
          <div className="med-prompt-suggestions" aria-label="Suggested questions">
            {prompts.map((item) => (
              <button key={item.title} type="button" onClick={() => setSuggestion(item.text)}>
                <span>{item.title}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="med-composer-dock">
        <PromptInput loading={loading} onSend={handleSend} onStop={() => abortRef.current?.abort()}
          suggestion={suggestion} placeholder="Ask a health question or attach a document…"
          attachments={attachments} onAddFiles={addFiles} onRemoveAttachment={removeAttachment} onRetryAttachment={retryAttachment} />
      </div>
    </div>
  );
}
