// Message model
import { prisma } from "../lib/prisma";

export class MessageModel {
  async findById(id: number) {
    return prisma.message.findUnique({ where: { id } });
  }

  async create(data: { chatId: number; role: string; content: string }) {
    return prisma.message.create({ data });
  }

  async findManyByChatId(chatId: number) {
    return prisma.message.findMany({
      where: { chatId },
      orderBy: { timestamp: "asc" },
    });
  }
}

export const messageModel = new MessageModel();
