import { useEffect, useState, useRef } from 'react';
import { assets } from '../assets/assets';
import Message from './Message';
import { PromptInput } from './PromptInput';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../store/chatStore';
import { useTheme } from '../store/themeStore';
import { ApiService } from '../api/api.service';
import toast from 'react-hot-toast';

export function ChatDetails() {
  const { theme } = useTheme();
  const { setChats } = useChat();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const numericId = id ? parseInt(id, 10) : NaN;
  const isValidId = !isNaN(numericId) && numericId > 0;

  // React-Query hook to fetch single chat
  const {
    data: fetchedChat,
    isLoading: isChatLoading,
    isError: isChatError,
  } = ApiService.chats.useFetchChat(isValidId ? numericId : null);

  const sendMessageMutation = ApiService.chats.useSendMessage();

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

  const sendMessage = async (prompt: string) => {
    if (!isValidId || !prompt.trim() || isSending) return;

    // Optimistically add user message to UI
    const newUserMessage = { role: 'user', content: prompt, timestamp: new Date() };
    setSelectedChat((prev: any) => ({
      ...prev,
      messages: [...(prev?.messages || []), newUserMessage],
    }));
    setIsSending(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        chatId: numericId,
        content: prompt,
      });

      if (response?.success) {
        setSelectedChat((prev: any) => {
          const updatedMessages = prev?.messages ? prev.messages.slice(0, -1) : [];
          return {
            ...prev,
            messages: [...updatedMessages, response.userMessage, response.assistantMessage],
          };
        });

        // Update global chats store
        setChats((prevChats: any[]) =>
          prevChats.map((c) =>
            c.id === numericId
              ? {
                  ...c,
                  messages: [...(c.messages || []), response.userMessage, response.assistantMessage],
                }
              : c
          )
        );
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error?.message || 'Error sending message. Please try again.');
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
                <Message key={index} message={message} />
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
                      Analyzing medical knowledge base...
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
          mode="text"
          placeholder="Continue this consultation..."
        />
      </div>
    </div>
  );
}

export default ChatDetails;
