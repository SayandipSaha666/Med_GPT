import { createContext, useContext, useState, ReactNode, type Dispatch, type SetStateAction } from 'react';
import { T_Chat } from '../types/chat';

interface IChatContext {
  chats: T_Chat[];
  setChats: Dispatch<SetStateAction<T_Chat[]>>;
  currentChat: T_Chat | null;
  setCurrentChat: (chat: T_Chat | null) => void;
}

const ChatContext = createContext<IChatContext | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChatsState] = useState<T_Chat[]>([]);
  const [currentChat, setCurrentChatState] = useState<T_Chat | null>(null);

  const setCurrentChat = (chat: T_Chat | null) => {
    setCurrentChatState(chat);
  };

  return (
    <ChatContext.Provider value={{ chats, setChats: setChatsState, currentChat, setCurrentChat }}>
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
