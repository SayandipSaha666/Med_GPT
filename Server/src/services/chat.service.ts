import { chatRepository } from "../repositories/chat.repository";
import { messageRepository } from "../repositories/message.repository";
import type { Chat, ChatWithMessages, CreateChatDto, UpdateChatDto } from "../dto/chat.dto";
import type { Message } from "../dto/message.dto";

export class ChatService {
  async createChat(userId: number, title?: string): Promise<Chat> {
    const chat = await chatRepository.create({
      userId,
      title: title || "New Chat",
    });
    return chat;
  }

  async getChats(userId: number): Promise<ChatWithMessages[]> {
    const chats = await chatRepository.findByUserId(userId);
    if (chats.length === 0) {
      return [];
    }
    return chats as ChatWithMessages[];
  }

  async getChatById(chatId: number, userId: number): Promise<ChatWithMessages | null> {
    const chat = await chatRepository.findById(chatId);
    if (!chat || chat.userId !== userId) {
      return null;
    }
    const messages = await messageRepository.findManyByChatId(chatId);
    return { ...chat, messages };
  }

  async deleteChat(chatId: number, userId: number): Promise<void> {
    const chat = await chatRepository.findById(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found");
    }
    await chatRepository.delete(chatId);
  }

  async updateChatTitle(chatId: number, userId: number, title: string): Promise<Chat> {
    const chat = await chatRepository.findById(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found");
    }
    return chatRepository.update(chatId, { title });
  }

  async getUserChatsWithLastMessage(userId: number): Promise<ChatWithMessages[]> {
    return this.getChats(userId);
  }
}

export const chatService = new ChatService();
