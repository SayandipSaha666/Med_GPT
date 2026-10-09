import React, { useState, useRef, useEffect } from 'react';
import { assets } from '../assets/assets';

interface PromptInputProps {
  loading: boolean;
  onSend: (prompt: string, mode: string) => void;
  mode?: string;
  setMode?: (mode: string) => void;
  placeholder?: string;
}

export function PromptInput({
  loading,
  onSend,
  mode = 'text',
  setMode,
  placeholder = 'Ask anything about symptoms, treatments, medications...',
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;
    onSend(prompt.trim(), mode);
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="
          relative rounded-2xl
          bg-white/90 dark:bg-[#181527]/90 backdrop-blur-xl
          border border-purple-200/80 dark:border-purple-900/60
          shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10 dark:shadow-black/40
          focus-within:border-purple-500 dark:focus-within:border-purple-400
          focus-within:ring-4 focus-within:ring-purple-500/10
          transition-all duration-200 p-2 sm:p-3
        "
      >
        <div className="flex items-end gap-2.5">
          {/* Medical Pulse Indicator / Icon */}
          <div className="p-2 hidden sm:flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>

          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading}
            className="
              flex-1 w-full max-h-40 min-h-[24px] py-1.5 px-2
              text-sm text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              bg-transparent outline-none resize-none
              disabled:opacity-50 scrollbar-thin
            "
          />

          {/* Send / Stop Button */}
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`
              p-2.5 rounded-xl flex items-center justify-center
              transition-all duration-200 shrink-0
              ${
                prompt.trim() && !loading
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md shadow-purple-500/25 hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-gray-100 dark:bg-purple-950/40 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
            `}
            title={loading ? 'Processing response...' : 'Send prompt (Enter)'}
            aria-label="Send message"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-purple-600 dark:text-purple-300" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 transform rotate-45 -mr-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>

        {/* Helper footer inside prompt input */}
        <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-100/80 dark:border-purple-950/40 mt-1 text-[11px] text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              MedGPT v2.0
            </span>
            <span className="hidden sm:inline opacity-60">• Shift+Enter for new line</span>
          </div>

          <div className="flex items-center gap-1">
            {setMode && (
              <button
                type="button"
                onClick={() => setMode(mode === 'text' ? 'research' : 'text')}
                className="text-[11px] px-2 py-0.5 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 transition-colors"
              >
                Mode: <span className="font-semibold capitalize">{mode}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Safety Disclaimer */}
      <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 mt-2 px-4">
        MedGPT is an AI assistant for health information. Always consult a qualified healthcare professional for medical diagnoses.
      </p>
    </div>
  );
}

export default PromptInput;
