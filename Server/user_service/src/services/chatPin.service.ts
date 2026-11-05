import { prisma } from "../lib/prisma";
import { chatPinRepository } from "../repositories/chatPin.repository";

async function assertOwnedChat(chatId: number, userId: number) {
  const chat = await prisma.chat.findFirst({ where: { id: chatId, userId }, select: { id: true } });
  if (!chat) throw new Error("Chat not found");
}

export const chatPinService = {
  list: (userId: number) => chatPinRepository.list(userId),
  async pin(chatId: number, userId: number) {
    await assertOwnedChat(chatId, userId);
    return chatPinRepository.pin(chatId, userId);
  },
  async unpin(chatId: number, userId: number) {
    await assertOwnedChat(chatId, userId);
    await chatPinRepository.unpin(chatId, userId);
  },
};
