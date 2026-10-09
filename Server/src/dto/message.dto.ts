// Message DTOs
export interface Message {
  id: number;
  chatId: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface CreateMessageDto {
  chatId: number;
  role: "user" | "assistant";
  content: string;
}

export interface MessageResponse {
  userMessage: Message;
  assistantMessage: Message;
  sources: string[];
}
