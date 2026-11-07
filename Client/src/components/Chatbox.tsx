import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const { folderId: folderParam } = useParams();
  const folderId = folderParam && /^\d+$/.test(folderParam) ? Number(folderParam) : null;
  const { data: folders = [], isLoading: foldersLoading } = ApiService.chatFolders.useFolders();
  const { data: chats = [] } = ApiService.chats.useFetchChats();
  const addChatToFolder = ApiService.chatFolders.useAddChat();
  const folder = folders.find((item) => item.id === folderId);
  const folderChats = folder ? chats.filter((chat) => folder.chatIds.includes(chat.id)) : [];
  const childFolders = folder ? folders.filter((item) => item.parentId === folder.id) : [];
  const breadcrumb = [] as typeof folders;
  if (folder) {
    let current = folder.parentId;
    const seen = new Set<number>([folder.id]);
    while (current !== null && !seen.has(current)) {
      const parent = folders.find((item) => item.id === current);
      if (!parent) break;
      breadcrumb.unshift(parent);
      seen.add(current);
      current = parent.parentId;
    }
  }
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const draftChatIdRef = useRef<number | null>(null);
  const { attachments, addFiles, removeAttachment, retryAttachment, clearAttachments } = useChatAttachments();
  const createChat = ApiService.chats.useCreateChat();
  const sendMessage = ApiService.chats.useSendMessage();

  const handleSend = useCallback(async (prompt: string, _mode: string, currentAttachments?: T_FileAttachment[]): Promise<boolean> => {
    if (folderId !== null && !folder) {
      toast.error(foldersLoading ? 'Folder is still loading. Try again shortly.' : 'This folder is unavailable. Choose another folder.');
      return false;
    }
    const readyFiles = (currentAttachments ?? attachments).filter((item) => item.status === 'ready' && item.url);
    if (!prompt.trim() && readyFiles.length === 0) return false;
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const title = prompt.trim() ? `${prompt.trim().slice(0, 55)}${prompt.trim().length > 55 ? '…' : ''}` : `Review ${readyFiles[0].name}`;
      const chatId = draftChatIdRef.current ?? (await createChat.mutateAsync({ title })).id;
      draftChatIdRef.current = chatId;
      if (folderId !== null && folder) await addChatToFolder.mutateAsync({ folderId, chatId });
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
  }, [attachments, clearAttachments, createChat, navigate, sendMessage, folderId, folder, foldersLoading, addChatToFolder]);

  return (
    <div className="med-workspace">
      <header className="med-topbar">
        <div className="med-topbar-inner"><span className="med-topbar-title">{folder ? `${folder.name} / New conversation` : 'New conversation'}</span><span className="med-topbar-context">Health research workspace</span></div>
      </header>
      <div className="med-scroll-area med-empty-scroll">
        <section className="med-empty" aria-labelledby="med-welcome-heading">
          <div className="med-empty-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></div>
          <h1 id="med-welcome-heading">{folder ? folder.name : 'What would you like to understand?'}</h1>
          <p>{folder ? 'Start a conversation in this folder or return to one below.' : 'Explore health questions, make sense of medical information, or add a document for context. MedGPT helps you prepare for a more informed conversation with a clinician.'}</p>
          {folderId !== null && !foldersLoading && !folder && <p role="alert">This folder is unavailable. Choose another folder from the sidebar.</p>}
          {folder && <nav className="med-folder-breadcrumb" aria-label="Folder path"><button type="button" onClick={() => navigate('/main/chat')}>All chats</button>{breadcrumb.map((part) => <span key={part.id}> / <button type="button" onClick={() => navigate(`/main/folder/${part.id}`)}>{part.name}</button></span>)}<span> / {folder.name}</span></nav>}
          {folder && <section className="med-folder-contents" aria-label="Contents of this folder">
            {childFolders.length > 0 && <><h2>Subfolders</h2>{childFolders.map((child) => <button type="button" key={child.id} onClick={() => navigate(`/main/folder/${child.id}`)}>{child.name} <span aria-hidden="true">→</span></button>)}</>}
            <h2>Conversations</h2>{folderChats.length ? folderChats.map((chat) => <button type="button" key={chat.id} onClick={() => navigate(`/main/chat/${chat.id}`)}>{chat.title || 'New chat'} <span aria-hidden="true">→</span></button>) : <p>No conversations in this folder yet. Ask a question to create one.</p>}
          </section>}
          {!folder && <div className="med-prompt-suggestions" aria-label="Suggested questions">
            {prompts.map((item) => (
              <button key={item.title} type="button" onClick={() => setSuggestion(item.text)}>
                <span>{item.title}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
              </button>
            ))}
          </div>}
        </section>
      </div>
      <div className="med-composer-dock">
        <PromptInput loading={loading || (folderId !== null && foldersLoading)} onSend={handleSend} onStop={() => abortRef.current?.abort()}
          suggestion={suggestion} placeholder="Ask a health question or attach a document…"
          attachments={attachments} onAddFiles={addFiles} onRemoveAttachment={removeAttachment} onRetryAttachment={retryAttachment} />
      </div>
    </div>
  );
}
