import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../store/chatStore';
import { assets } from '../assets/assets';
import Message from './Message';
import { PromptInput } from './PromptInput';
import { useTheme } from '../store/themeStore';
import { ApiService } from '../api/api.service';
import toast from 'react-hot-toast';

export default function Chatbox() {
  const { theme } = useTheme();
  const { currentChat } = useChat();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<{ content: string; role: string; timestamp: Date }[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('text');
  const containerRef = useRef<HTMLDivElement>(null);

  const createChatMutation = ApiService.chats.useCreateChat();
  const sendMessageMutation = ApiService.chats.useSendMessage();

  useEffect(() => {
    if (currentChat?.messages) {
      setMessages(currentChat.messages);
    } else {
      setMessages([]);
    }
  }, [currentChat]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading]);

  const handleSend = useCallback(async (prompt: string, _selectedMode: string) => {
    if (!prompt.trim()) return;

    // Add user message to UI state immediately
    const userMsg = { content: prompt, role: 'user', timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // If we don't have an active chat ID yet, create one first
      const title = prompt.length > 30 ? `${prompt.slice(0, 30)}...` : prompt;
      const newChat = await createChatMutation.mutateAsync({ title });

      if (newChat?.id) {
        // Send the message in the newly created chat
        const response = await sendMessageMutation.mutateAsync({
          chatId: newChat.id,
          content: prompt,
        });

        if (response?.success) {
          toast.success('Consultation started! 💬');
          navigate(`/main/chat/${newChat.id}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error?.message || 'Failed to send message. Please try again.');
      setLoading(false);
    }
  }, [createChatMutation, sendMessageMutation, navigate]);

  const quickPrompts = [
    {
      icon: '🩺',
      title: 'Symptom Analysis',
      text: 'I have a sore throat, mild fever, and dry cough. What could be the causes?',
    },
    {
      icon: '💊',
      title: 'Drug Interaction',
      text: 'Can I take ibuprofen and paracetamol together safely?',
    },
    {
      icon: '🧪',
      title: 'Lab Test Breakdown',
      text: 'What does a high neutrophil count in a complete blood count test indicate?',
    },
    {
      icon: '🥗',
      title: 'Diet & Wellness',
      text: 'What are evidence-based lifestyle changes to naturally lower high blood pressure?',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-gradient-to-b from-[#faf9fc] to-[#f3f0f7] dark:from-[#0e0d16] dark:to-[#151322] transition-colors duration-300 relative">
      {/* Top Subtle Bar */}
      <div className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-purple-100/60 dark:border-purple-950/40 bg-white/40 dark:bg-[#12101e]/40 backdrop-blur-md">
        <div className="flex items-center gap-2 pl-12 md:pl-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            MedGPT Online • AI Health Assistant
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
            General Medicine
          </span>
        </div>
      </div>

      {/* Middle Chat Messages / Middle Welcome Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-purple-200 dark:scrollbar-thumb-purple-900"
      >
        <div className="max-w-4xl mx-auto w-full min-h-full flex flex-col justify-start">
          {messages.length === 0 ? (
            /* Centered Welcome & Icon in the Middle */
            <div className="my-auto flex flex-col items-center justify-center text-center py-8 px-4 animate-fade-in">
              {/* Glowing Logo Badge */}
              <div className="relative mb-6 group">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-700"></div>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-[#1a1727] p-3 shadow-xl border border-purple-100 dark:border-purple-800/50 flex items-center justify-center">
                  <img
                    src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
                    alt="MedGPT"
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                How can I assist your health today?
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                Ask about clinical symptoms, medications, medical terms, or lab reports in clear, easy-to-understand language.
              </p>

              {/* Quick Prompt Recommendation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl text-left">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(item.text, mode)}
                    className="
                      p-3.5 rounded-2xl
                      bg-white/80 dark:bg-[#191629]/80 backdrop-blur-md
                      border border-purple-100 dark:border-purple-900/40
                      hover:border-purple-400 dark:hover:border-purple-600
                      hover:bg-white dark:hover:bg-[#201c34]
                      hover:shadow-md hover:shadow-purple-500/10
                      active:scale-[0.98] transition-all duration-200 cursor-pointer group
                    "
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      "{item.text}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Render Message History */
            <div className="space-y-4 pb-4">
              {messages.map((message, index) => (
                <Message key={index} message={message} />
              ))}

              {/* Researching / Loading Indicator */}
              {loading && (
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
          loading={loading}
          onSend={handleSend}
          mode={mode}
          setMode={setMode}
          placeholder="Ask MedGPT a medical question or describe symptoms..."
        />
      </div>
    </div>
  );
}
