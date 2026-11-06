import { useEffect, useState, useRef, useCallback } from 'react';
import ConversationScreen from './ConversationScreen';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../store/chatStore';
import { ApiService } from '../api/api.service';
import { useChatAttachments } from '../hooks/useChatAttachments';
import type { T_FileAttachment } from '../api/api.types';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { T_Api_Success_Res, T_User } from '../api/api.types';

export function ChatDetails() {
  const queryClient = useQueryClient();
  const { setChats } = useChat();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    removeAttachment,
    retryAttachment,
    clearAttachments,
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
        void queryClient.invalidateQueries({ queryKey: ['chat', numericId] });
        setIsSending(false);
        abortControllerRef.current = null;
        activeTaskIdRef.current = null;
        activeAssistantMessageIdRef.current = null;
      });
  }, [isSending, selectedChat?.messages, watchAgentTask, queryClient, numericId]);

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

  const sendMessage = async (
    prompt: string,
    _mode?: string,
    currentAttachments?: T_FileAttachment[]
  ): Promise<boolean> => {
    if (!isValidId || isSending) return false;
    if (!prompt.trim() && (!currentAttachments || currentAttachments.length === 0)) return false;

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
    const previousUser = queryClient.getQueryData<T_Api_Success_Res<T_User>>(['getMe']);
    if (previousUser && previousUser.data.credits >= 1) {
      queryClient.setQueryData<T_Api_Success_Res<T_User>>(['getMe'], {
        ...previousUser,
        data: { ...previousUser.data, credits: previousUser.data.credits - 1 },
      });
    }
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
      // Sent to /api/chats/:id/tasks
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
      clearAttachments();
      void queryClient.invalidateQueries({ queryKey: ['getMe'] });
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
          return true;
        } catch {
          // The task may have completed before the cancellation request arrived.
          stopRequestedRef.current = false;
        }
      }

      await watchAgentTask(queued.taskId, queued.assistantMessage.id, controller.signal);
      void queryClient.invalidateQueries({ queryKey: ['chat', numericId] });
      return true;
    } catch (error: any) {
      if (!taskAccepted && previousUser) {
        queryClient.setQueryData(['getMe'], previousUser);
        void queryClient.invalidateQueries({ queryKey: ['getMe'] });
      }
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        // User intentionally stopped generation
        return taskAccepted;
      }
      if (!taskAccepted) {
        setSelectedChat((prev: any) => ({
          ...prev,
          messages: (prev?.messages || []).slice(0, -1),
        }));
      }
      console.error('Failed to send message:', error);
      toast.error(error?.message || 'Error sending message. Please try again.');
      return taskAccepted;
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

  return (
    <ConversationScreen
      chat={selectedChat}
      isLoading={isChatLoading}
      isSending={isSending}
      onSend={sendMessage}
      onStop={handleStop}
      onEdit={handleEditMessage}
      onDelete={handleDeleteMessage}
      attachments={attachments}
      onAddFiles={addFiles}
      onRemoveAttachment={removeAttachment}
      onRetryAttachment={retryAttachment}
    />
  );
}

export default ChatDetails;
