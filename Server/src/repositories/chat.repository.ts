import { prisma } from "../lib/prisma";
import type { Chat } from "../dto/chat.dto";

export class ChatRepository {
  async findById(id: number): Promise<Chat | null> {
    return prisma.chat.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: number): Promise<Chat[]> {
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

  async create(data: {
    userId: number;
    title?: string;
  }): Promise<Chat> {
    return prisma.chat.create({
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.chat.delete({
      where: { id },
    });
  }

  async update(id: number, data: Partial<Chat>): Promise<Chat> {
    return prisma.chat.update({
      where: { id },
      data,
    });
  }
}

export const chatRepository = new ChatRepository();
