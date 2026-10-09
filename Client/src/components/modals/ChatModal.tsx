import React, { useState, useEffect, useRef } from 'react';

export type ModalMode = 'create' | 'edit' | 'delete' | null;

interface ChatModalProps {
  isOpen: boolean;
  mode: ModalMode;
  initialTitle?: string;
  chatId?: number | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (title: string, chatId?: number) => void;
  onConfirmDelete?: (chatId: number) => void;
}

export function ChatModal({
  isOpen,
  mode,
  initialTitle = '',
  chatId,
  isLoading = false,
  onClose,
  onSubmit,
  onConfirmDelete,
}: ChatModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || (mode === 'create' ? 'New Consultation' : ''));
      setTimeout(() => {
        if (inputRef.current && mode !== 'delete') {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, initialTitle, mode]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !mode) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'delete') {
      if (chatId != null && onConfirmDelete) {
        onConfirmDelete(chatId);
      }
    } else {
      const trimmed = title.trim();
      if (!trimmed) return;
      onSubmit(trimmed, chatId ?? undefined);
    }
  };

  const quickSuggestions = [
    '🩺 Health Checkup & Symptoms',
    '💊 Medication & Dosage Query',
    '🧪 Lab Report Analysis',
    '🥗 Diet & Wellness Advice',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => !isLoading && onClose()}
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white dark:bg-[#1a1726] border border-gray-200 dark:border-purple-900/40 rounded-2xl shadow-2xl p-6 overflow-hidden z-10 transition-all transform animate-scale-up"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center ${
                mode === 'delete'
                  ? 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                  : 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
              }`}
            >
              {mode === 'delete' ? (
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
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              ) : mode === 'edit' ? (
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
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              ) : (
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
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="9" x2="12" y2="15" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {mode === 'create'
                  ? 'Start New Chat'
                  : mode === 'edit'
                  ? 'Rename Conversation'
                  : 'Delete Conversation'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {mode === 'create'
                  ? 'Give your consultation topic a title to organize your history'
                  : mode === 'edit'
                  ? 'Update the title for this consultation'
                  : 'Are you sure? This action cannot be reversed.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === 'delete' ? (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 text-sm text-red-800 dark:text-red-300">
              <p className="font-medium">
                "{initialTitle || 'This chat'}" will be permanently removed.
              </p>
              <p className="text-xs mt-1 opacity-90">
                All message history and attached data in this chat will be lost.
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor="chat-title-input"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Chat Title
              </label>
              <input
                id="chat-title-input"
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                placeholder="e.g., Blood Pressure Analysis"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-purple-800/60 bg-white dark:bg-[#12101b] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-sm transition-all"
                required
              />
              <div className="flex justify-between items-center mt-1.5 px-0.5">
                <span className="text-[11px] text-gray-400">
                  Tip: A concise title helps you search your history faster.
                </span>
                <span className="text-[11px] text-gray-400 font-mono">
                  {title.length}/60
                </span>
              </div>

              {/* Quick suggestions for new chat */}
              {mode === 'create' && (
                <div className="mt-3">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Quick suggestions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTitle(suggestion)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (mode !== 'delete' && !title.trim())}
              className={`px-5 py-2 text-sm font-semibold rounded-xl text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                mode === 'delete'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-500/25'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
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
                  Processing...
                </span>
              ) : mode === 'create' ? (
                'Create Chat'
              ) : mode === 'edit' ? (
                'Save Title'
              ) : (
                'Delete Chat'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
