import { prisma } from "../lib/prisma";
import type { Message } from "../dto/message.dto";

export class MessageRepository {
  async findById(id: number): Promise<Message | null> {
    const msg = await prisma.message.findUnique({
      where: { id },
    });
    return msg as Message | null;
  }

  async create(data: {
    chatId: number;
    role: "user" | "assistant";
    content: string;
  }): Promise<Message> {
    const msg = await prisma.message.create({
      data,
    });
    return msg as Message;
  }

  async findManyByChatId(chatId: number): Promise<Message[]> {
    const msgs = await prisma.message.findMany({
      where: { chatId },
      orderBy: { timestamp: "asc" },
    });
    return msgs as Message[];
  }

  async findUniqueWhere(
    where: { id: number; userId: number }
  ): Promise<Message | null> {
    const msg = await prisma.message.findUnique({
      where,
    });
    return msg as Message | null;
  }
}

export const messageRepository = new MessageRepository();
