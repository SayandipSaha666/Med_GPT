import { createContext, useContext, useState, ReactNode } from 'react';
import { T_Chat } from '../types/chat';

interface IChatContext {
  chats: T_Chat[];
  setChats: (chats: T_Chat[]) => void;
  currentChat: T_Chat | null;
  setCurrentChat: (chat: T_Chat | null) => void;
}

const ChatContext = createContext<IChatContext | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChatsState] = useState<T_Chat[]>([]);
  const [currentChat, setCurrentChatState] = useState<T_Chat | null>(null);

  const setChats = (newChats: T_Chat[]) => {
    setChatsState(newChats);
  };

  const setCurrentChat = (chat: T_Chat | null) => {
    setCurrentChatState(chat);
  };

  return (
    <ChatContext.Provider value={{ chats, setChats, currentChat, setCurrentChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
