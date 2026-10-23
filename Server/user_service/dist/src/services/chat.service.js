"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const chat_repository_1 = require("../repositories/chat.repository");
const message_repository_1 = require("../repositories/message.repository");
class ChatService {
    async createChat(userId, title) {
        const chat = await chat_repository_1.chatRepository.create({
            userId,
            title: title || "New Chat",
        });
        return chat;
    }
    async getChats(userId) {
        const chats = await chat_repository_1.chatRepository.findByUserId(userId);
        if (chats.length === 0) {
            return [];
        }
        return chats;
    }
    async getChatById(chatId, userId) {
        const chat = await chat_repository_1.chatRepository.findById(chatId);
        if (!chat || chat.userId !== userId) {
            return null;
        }
        const messages = await message_repository_1.messageRepository.findManyByChatId(chatId);
        return { ...chat, messages };
    }
    async deleteChat(chatId, userId) {
        const chat = await chat_repository_1.chatRepository.findById(chatId);
        if (!chat || chat.userId !== userId) {
            throw new Error("Chat not found");
        }
        await chat_repository_1.chatRepository.delete(chatId);
    }
    async updateChatTitle(chatId, userId, title) {
        const chat = await chat_repository_1.chatRepository.findById(chatId);
        if (!chat || chat.userId !== userId) {
            throw new Error("Chat not found");
        }
        return chat_repository_1.chatRepository.update(chatId, { title });
    }
    async getUserChatsWithLastMessage(userId) {
        return this.getChats(userId);
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
