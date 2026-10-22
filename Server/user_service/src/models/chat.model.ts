// Chat model
import { prisma } from "../lib/prisma";

export class ChatModel {
  async findById(id: number) {
    return prisma.chat.findUnique({ where: { id } });
  }

  async findByUserId(userId: number) {
    return prisma.chat.findMany({
      where: { userId },
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: "desc" },
        },
      },
    });
  }

  async create(data: { userId: number; title?: string }) {
    return prisma.chat.create({ data });
  }

  async delete(id: number) {
    return prisma.chat.delete({ where: { id } });
  }

  async update(id: number, data: Partial<any>) {
    return prisma.chat.update({ where: { id }, data });
  }
}

export const chatModel = new ChatModel();
