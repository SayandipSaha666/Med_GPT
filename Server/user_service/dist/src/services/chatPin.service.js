"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatPinService = void 0;
const prisma_1 = require("../lib/prisma");
const chatPin_repository_1 = require("../repositories/chatPin.repository");
async function assertOwnedChat(chatId, userId) {
    const chat = await prisma_1.prisma.chat.findFirst({ where: { id: chatId, userId }, select: { id: true } });
    if (!chat)
        throw new Error("Chat not found");
}
exports.chatPinService = {
    list: (userId) => chatPin_repository_1.chatPinRepository.list(userId),
    async pin(chatId, userId) {
        await assertOwnedChat(chatId, userId);
        return chatPin_repository_1.chatPinRepository.pin(chatId, userId);
    },
    async unpin(chatId, userId) {
        await assertOwnedChat(chatId, userId);
        await chatPin_repository_1.chatPinRepository.unpin(chatId, userId);
    },
};
