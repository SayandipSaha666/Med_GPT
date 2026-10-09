// Chat DTOs
import { Message } from "./message.dto";

export interface Chat {
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}

export interface CreateChatDto {
  userId: number;
  title?: string;
}

export interface UpdateChatDto {
  title: string;
  chatId: number;
}
