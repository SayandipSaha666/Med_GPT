import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useChat } from '../store/chatStore';
import { assets } from '../assets/assets';
import Message from './Message';
import PromptInput from './PromptInput';
import { useTheme } from '../store/themeStore';

export default function Chatbox() {
  const { theme } = useTheme();
  const { currentChat } = useChat();
  const [messages, setMessages] = useState<{ content: string; role: string; timestamp: Date }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [mode, setMode] = useState('text');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback((prompt: string, selectedMode: string) => {
    setMessages((prev) => [...prev, { content: prompt, role: 'user', timestamp: new Date() }]);
    setLoading(true);
  }, []);

  useEffect(() => {
    if (currentChat) {
      setMessages(currentChat.messages || []);
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
  }, [messages]);

  return (
    <div className="px-3 py-3 flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14 2xl:pr-40">
      {/* Chat Messages */}
      <div ref={containerRef} className="flex-1 mb-5 overflow-y-scroll">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
            <img
              src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
              alt="MedGPT Logo"
              className="w-full max-w-56 sm:max-w-68"
            />
            <p className="mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white">
              Ask me anything
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        {/* Three dot while loading */}
        {loading && (
          <div className="loader flex items-center gap-1.5">
            <p className="text-primary text-lg">Researching</p>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
            </div>
          </div>
        )}
      </div>
      {mode === 'image' && (
        <label className="inline-flex items-center gap-2 mb-3 text-sm mx-auto">
          <p className="text-xs">Publish generated image to community</p>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </label>
      )}
      {/* Prompt Input Box */}
      <PromptInput loading={loading} onSend={handleSend} mode={mode} setMode={setMode} />
    </div>
  );
}
