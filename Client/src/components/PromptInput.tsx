import React, { useState } from 'react';
import { assets } from '../assets/assets';

interface PromptInputProps {
  loading: boolean;
  onSend: (prompt: string, mode: string) => void;
  mode: string;
  setMode: (mode: string) => void;
}

function PromptInput({ loading, onSend, mode, setMode }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onSend(prompt, mode);
    setPrompt('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/30 rounded-full w-full max-w-2xl p-3 pl-4 flex gap-4 items-center"
    >
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your prompt here..."
        className="flex-1 w-full text-sm outline-none bg-transparent"
        required
      />
      <button type="submit" disabled={loading}>
        <img
          src={loading ? assets.stop_icon : assets.send_icon}
          alt="Send"
          className="w-8 cursor-pointer hover:scale-110 transition-transform"
        />
      </button>
    </form>
  );
}

export default PromptInput;
