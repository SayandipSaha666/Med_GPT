// Chat types
export interface T_Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isImage?: boolean;
}

export interface T_Chat {
  id: number;
  title: string;
  messages: T_Message[];
  createdAt: string;
  updatedAt: string;
}

export interface T_Create_Chat_Response {
  chat: T_Chat;
}

export interface T_Send_Message_Response {
  success: boolean;
  userMessage: T_Message;
  assistantMessage: T_Message;
}
