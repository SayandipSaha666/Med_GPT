import { useEffect, useState, useRef, useCallback } from 'react';
import { assets } from '../assets/assets';
import Message from './Message';
import { PromptInput } from './PromptInput';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../store/chatStore';
import { useTheme } from '../store/themeStore';
import { ApiService } from '../api/api.service';
import { useChatAttachments } from '../hooks/useChatAttachments';
import type { T_FileAttachment } from '../api/api.types';
import toast from 'react-hot-toast';

export function ChatDetails() {
  const { theme } = useTheme();
  const { setChats } = useChat();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeTaskIdRef = useRef<string | null>(null);
  const activeAssistantMessageIdRef = useRef<number | string | null>(null);
  const observedTaskIdsRef = useRef(new Set<string>());
  const stopRequestedRef = useRef(false);

  const numericId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(numericId) && numericId > 0;

  // React-Query hook to fetch single chat
  const {
    data: fetchedChat,
    isLoading: isChatLoading,
    isError: isChatError,
  } = ApiService.chats.useFetchChat(isValidId ? numericId : null);

  const {
    attachments,
    addFiles,
    removeAttachment
  } = useChatAttachments();

  const deleteMessageMutation = ApiService.chats.useDeleteMessage();
  const editMessageMutation = ApiService.chats.useEditMessage();

  const applyTaskStreamEvent = useCallback((assistantId: number | string, event: { type: string; status?: string; progressMessage?: string; agentType?: string; content?: string }) => {
    const updateAssistant = (messages: any[]) => messages.map((message) => {
      if (String(message.id) !== String(assistantId)) return message;
      if (event.type === 'end') {
        return {
          ...message,
          metadata: {
            ...(message.metadata || {}),
            generationStatus: event.status || 'completed',
            ...(event.progressMessage ? { progressMessage: event.progressMessage } : {}),
          },
        };
      }
      return {
        ...message,
        content: event.content ?? message.content,
        agentType: event.agentType ?? message.agentType,
        metadata: {
          ...(message.metadata || {}),
          generationStatus: event.status || 'generating',
          progressMessage: event.progressMessage,
        },
      };
    });

    setSelectedChat((prev: any) => ({ ...prev, messages: updateAssistant(prev?.messages || []) }));
    setChats((prevChats: any[]) => prevChats.map((chat) =>
      chat.id === numericId
        ? { ...chat, messages: updateAssistant(chat.messages || []) }
        : chat,
    ));
  }, [numericId, setChats]);

  const watchAgentTask = useCallback((taskId: string, assistantId: number | string, signal: AbortSignal) =>
    ApiService.chats.streamAgentTask(numericId, taskId, signal, (event) => applyTaskStreamEvent(assistantId, event)),
  [applyTaskStreamEvent, numericId]);

  // Reattach to a durable task after a refresh or route revisit.
  useEffect(() => {
    if (isSending) return;
    const pending = (selectedChat?.messages || []).find((message: any) =>
      message.role === 'assistant'
      && ['queued', 'running', 'routing', 'handed_off', 'generating'].includes(String(message.metadata?.generationStatus || ''))
      && typeof message.metadata?.taskId === 'string',
    );
    if (!pending) return;
    const taskId = String(pending.metadata.taskId);
    if (observedTaskIdsRef.current.has(taskId)) return;

    observedTaskIdsRef.current.add(taskId);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    stopRequestedRef.current = false;
    activeTaskIdRef.current = taskId;
    activeAssistantMessageIdRef.current = pending.id;
    setIsSending(true);
    void watchAgentTask(taskId, pending.id, controller.signal)
      .catch((error) => toast.error(error?.message || 'Lost connection to response generation.'))
      .finally(() => {
        setIsSending(false);
        abortControllerRef.current = null;
        activeTaskIdRef.current = null;
        activeAssistantMessageIdRef.current = null;
      });
  }, [isSending, selectedChat?.messages, watchAgentTask]);

  // Validate ID and redirect to 404 if invalid
  useEffect(() => {
    if (!isValidId) {
      navigate('/404', { replace: true });
    }
  }, [isValidId, navigate]);

  // Handle fetch error (e.g. chat not found / deleted)
  useEffect(() => {
    if (isChatError) {
      toast.error('Consultation not found or access denied.');
      navigate('/404', { replace: true });
    }
  }, [isChatError, navigate]);

  // Sync fetched chat to local state
  useEffect(() => {
    if (fetchedChat) {
      setSelectedChat(fetchedChat);
    }
  }, [fetchedChat]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [selectedChat?.messages, isSending]);

  const sendMessage = async (
    prompt: string,
    _mode?: string,
    currentAttachments?: T_FileAttachment[]
  ) => {
    if (!isValidId || isSending) return;
    if (!prompt.trim() && (!currentAttachments || currentAttachments.length === 0)) return;

    const stagedFiles = (currentAttachments || attachments).filter(
      (a) => a.status === 'ready' && !!a.url
    );

    const attachedFilesPayload = stagedFiles.map((a) => ({
      id: a.id,
      name: a.name,
      mime: a.mime,
      sizeBytes: a.sizeBytes,
      url: a.url!,
    }));

    // Optimistically add user message to UI
    const newUserMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date(),
      files: attachedFilesPayload.length > 0 ? attachedFilesPayload : undefined,
    };
    setSelectedChat((prev: any) => ({
      ...prev,
      messages: [...(prev?.messages || []), newUserMessage],
    }));
    setIsSending(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let taskAccepted = false;

    try {
      let messageContent = prompt;
      if (attachedFilesPayload.length > 0) {
        const filesContext = attachedFilesPayload
          .map((f) => `[File Attachment: ${f.name}](${f.url})`)
          .join('\n');
        messageContent = prompt.trim()
          ? `${prompt}\n\nAttached Medical Documents:\n${filesContext}`
          : `Please review and summarize the attached medical document(s):\n${filesContext}`;
      }

      const queued = await ApiService.chats.createAgentTask(
        numericId,
        messageContent,
        attachedFilesPayload.map((f) => f.id),
        controller.signal,
      );

      activeTaskIdRef.current = queued.taskId;
      activeAssistantMessageIdRef.current = queued.assistantMessage.id;
      observedTaskIdsRef.current.add(queued.taskId);
      taskAccepted = true;
      setSelectedChat((prev: any) => ({
        ...prev,
        messages: [
          ...(prev?.messages || []).slice(0, -1),
          { ...queued.userMessage, files: attachedFilesPayload },
          queued.assistantMessage,
        ],
      }));
      setChats((prevChats: any[]) => prevChats.map((chat) =>
        chat.id === numericId
          ? { ...chat, messages: [...(chat.messages || []), queued.userMessage, queued.assistantMessage] }
          : chat,
      ));

      if (stopRequestedRef.current) {
        try {
          await ApiService.chats.cancelAgentTask(numericId, queued.taskId);
          applyTaskStreamEvent(queued.assistantMessage.id, {
            type: 'end',
            status: 'cancelled',
            progressMessage: 'Response generation stopped.',
          });
          return;
        } catch {
          // The task may have completed before the cancellation request arrived.
          stopRequestedRef.current = false;
        }
      }

      await watchAgentTask(queued.taskId, queued.assistantMessage.id, controller.signal);
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        // User intentionally stopped generation
        return;
      }
      if (!taskAccepted) {
        setSelectedChat((prev: any) => ({
          ...prev,
          messages: (prev?.messages || []).slice(0, -1),
        }));
      }
      console.error('Failed to send message:', error);
      toast.error(error?.message || 'Error sending message. Please try again.');
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
      activeTaskIdRef.current = null;
      activeAssistantMessageIdRef.current = null;
      stopRequestedRef.current = false;
    }
  };

  const handleStop = () => {
    const taskId = activeTaskIdRef.current;
    const assistantId = activeAssistantMessageIdRef.current;
    if (!taskId) {
      stopRequestedRef.current = true;
      toast('Stopping response generation…');
      return;
    }

    void ApiService.chats.cancelAgentTask(numericId, taskId).then(() => {
      abortControllerRef.current?.abort();
      applyTaskStreamEvent(assistantId!, {
        type: 'end',
        status: 'cancelled',
        progressMessage: 'Response generation stopped.',
      });
      toast('Response generation stopped.');
    }).catch((error) => {
      console.warn('Unable to cancel agent task:', error);
      toast('The response may have completed before it could be stopped.');
    });
  };

  const handleDeleteMessage = async (messageId: number | string) => {
    if (!isValidId) return;
    try {
      const numMsgId = Number(messageId);
      const res = await deleteMessageMutation.mutateAsync({
        chatId: numericId,
        messageId: numMsgId,
      });

      const deletedIds = res?.deletedIds || [numMsgId];
      setSelectedChat((prev: any) => ({
        ...prev,
        messages: (prev?.messages || []).filter((m: any) => !deletedIds.includes(Number(m.id))),
      }));

      // Update global chats list
      setChats((prevChats: any[]) =>
        prevChats.map((c) =>
          c.id === numericId
            ? {
                ...c,
                messages: (c.messages || []).filter((m: any) => !deletedIds.includes(Number(m.id))),
              }
            : c
        )
      );

      toast.success('Message and AI response deleted.');
    } catch (err: any) {
      console.error('Delete message error:', err);
      toast.error(err?.message || 'Failed to delete message');
    }
  };

  const handleEditMessage = async (messageId: number | string, newContent: string) => {
    if (!isValidId) return;
    try {
      setIsSending(true);
      const numMsgId = Number(messageId);
      const res = await editMessageMutation.mutateAsync({
        chatId: numericId,
        messageId: numMsgId,
        content: newContent,
      });

      if (res?.userMessage && res?.assistantMessage) {
        setSelectedChat((prev: any) => {
          const currentMsgs = prev?.messages || [];
          const userIdx = currentMsgs.findIndex((m: any) => Number(m.id) === numMsgId);
          if (userIdx === -1) return prev;

          let deleteCount = 1;
          if (userIdx + 1 < currentMsgs.length && currentMsgs[userIdx + 1].role === 'assistant') {
            deleteCount = 2;
          }

          const newMsgs = [...currentMsgs];
          newMsgs.splice(userIdx, deleteCount, res.userMessage, res.assistantMessage);

          return { ...prev, messages: newMsgs };
        });

        toast.success('Message updated and response regenerated! 🔄');
      }
    } catch (err: any) {
      console.error('Edit message error:', err);
      toast.error(err?.message || 'Failed to edit and resubmit message');
    } finally {
      setIsSending(false);
    }
  };

  // Loading state
  if (isChatLoading && !selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#faf9fc] dark:bg-[#0e0d16]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 p-0.5 animate-pulse">
              <div className="w-full h-full bg-white dark:bg-gray-900 rounded-[14px] flex items-center justify-center p-2">
                <img
                  src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
                  alt="MedGPT"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <div className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></div>
            Loading consultation history...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-gradient-to-b from-[#faf9fc] to-[#f3f0f7] dark:from-[#0e0d16] dark:to-[#151322] transition-colors duration-300 relative">
      {/* Top Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-purple-100/60 dark:border-purple-950/40 bg-white/40 dark:bg-[#12101e]/40 backdrop-blur-md">
        <div className="flex items-center gap-3 pl-12 md:pl-0 truncate">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {selectedChat?.title || 'Medical Consultation'}
          </h2>
        </div>

        <button
          onClick={() => navigate('/main/chat')}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-800/60 transition-colors cursor-pointer shrink-0"
        >
          + New Chat
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900"
      >
        <div className="max-w-4xl mx-auto w-full min-h-full flex flex-col justify-start">
          {(!selectedChat?.messages || selectedChat.messages.length === 0) ? (
            <div className="my-auto flex flex-col items-center justify-center text-center py-10 px-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1a1727] p-2.5 shadow-lg border border-purple-100 dark:border-purple-800/40 mb-4 flex items-center justify-center">
                <img
                  src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
                  alt="MedGPT"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                How can I help you in this consultation?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Type your medical question below to begin receiving AI-assisted clinical insights.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {selectedChat.messages.map((message: any, index: number) => (
                <Message
                  key={message.id || index}
                  message={message}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  isSending={isSending}
                />
              ))}

              {/* Researching Animation */}
              {isSending && (
                <div className="flex items-start gap-3 my-4 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center p-1">
                      <img
                        src={theme === 'light' ? assets.logo_full_dark : assets.logo_full}
                        alt="MedGPT"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#191629]/90 border border-purple-200/80 dark:border-purple-900/50 shadow-sm flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                      Generating a response…
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Docked Prompt Input at the Bottom */}
      <div className="shrink-0 p-4 sm:p-6 pt-2 bg-gradient-to-t from-[#faf9fc] via-[#faf9fc]/90 to-transparent dark:from-[#0e0d16] dark:via-[#0e0d16]/90 dark:to-transparent z-10">
        <PromptInput
          loading={isSending}
          onSend={sendMessage}
          onStop={handleStop}
          mode="text"
          placeholder="Continue this consultation or attach reports/scans..."
          attachments={attachments}
          onAddFiles={addFiles}
          onRemoveAttachment={removeAttachment}
        />
      </div>
    </div>
  );
}

export default ChatDetails;
