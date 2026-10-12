import { prisma } from "../lib/prisma";
import type { Message } from "../dto/message.dto";
import { toMessage } from "../mapper/message.mapper";

export class MessageRepository {
  async findById(id: number): Promise<Message | null> {
    const msg = await prisma.message.findUnique({
      where: { id },
      include: { files: true },
    });
    return msg ? toMessage(msg) : null;
  }

  async create(data: {
    chatId: number;
    role: "user" | "assistant";
    content: string;
  }): Promise<Message> {
    const msg = await prisma.message.create({
      data,
      include: { files: true },
    });
    return toMessage(msg);
  }

  async findManyByChatId(chatId: number): Promise<Message[]> {
    const msgs = await prisma.message.findMany({
      where: { chatId },
      include: { files: true },
      orderBy: { timestamp: "asc" },
    });
    return msgs.map(toMessage);
  }

  async findUniqueWhere(where: { id: number }): Promise<Message | null> {
    const msg = await prisma.message.findUnique({
      where,
      include: { files: true },
    });
    return msg ? toMessage(msg) : null;
  }
}

export const messageRepository = new MessageRepository();
