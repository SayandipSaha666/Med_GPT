import { prisma } from "../lib/prisma";
import type { Message } from "../dto/message.dto";
import { toMessage } from "../mapper/message.mapper";
import { matchedKnowledgeResourceIds } from "./knowledge-resource-association";

const include = {
  files: true,
  knowledgeResources: {
    include: { knowledgeEntry: true },
    orderBy: { position: "asc" as const },
  },
};

export class MessageRepository {
  async findById(id: number): Promise<Message | null> {
    const msg = await prisma.message.findUnique({
      where: { id },
      include,
    });
    return msg ? toMessage(msg) : null;
  }

  async create(data: {
    chatId: number;
    role: "user" | "assistant";
    content: string;
    knowledgeEntryIds?: string[];
  }): Promise<Message> {
    const { knowledgeEntryIds, ...messageData } = data;
    const distinctIds = [...new Set(knowledgeEntryIds ?? [])];
    const existingEntries = distinctIds.length ? await prisma.knowledgeEntry.findMany({
      where: { id: { in: distinctIds } }, select: { id: true },
    }) : [];
    const linkedIds = matchedKnowledgeResourceIds(distinctIds, new Set(existingEntries.map((entry) => entry.id)));
    const msg = await prisma.message.create({
      data: {
        ...messageData,
        knowledgeResources: {
          create: linkedIds.map((knowledgeEntryId, position) => ({
            position,
            knowledgeEntry: { connect: { id: knowledgeEntryId } },
          })),
        },
      },
      include,
    });
    return toMessage(msg);
  }

  async findManyByChatId(chatId: number): Promise<Message[]> {
    const msgs = await prisma.message.findMany({
      where: { chatId },
      include,
      orderBy: { timestamp: "asc" },
    });
    return msgs.map(toMessage);
  }

  async findUniqueWhere(where: { id: number }): Promise<Message | null> {
    const msg = await prisma.message.findUnique({
      where,
      include,
    });
    return msg ? toMessage(msg) : null;
  }

  async updateAgentMetadata(
    messageId: number,
    data: { agentType?: string; confidence?: number }
  ): Promise<void> {
    await prisma.message.update({
      where: { id: messageId },
      data: {
        agentType: data.agentType ?? undefined,
        confidence: data.confidence ?? undefined,
      },
    });
  }

  async deleteById(id: number): Promise<void> {
    await prisma.message.delete({
      where: { id },
    });
  }

  async deleteManyByIds(ids: number[]): Promise<void> {
    await prisma.message.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async updateContent(id: number, content: string): Promise<Message> {
    const msg = await prisma.message.update({
      where: { id },
      data: { content },
      include,
    });
    return toMessage(msg);
  }

  async findNextAssistantMessage(chatId: number, userMessageId: number): Promise<Message | null> {
    const msg = await prisma.message.findFirst({
      where: {
        chatId,
        id: { gt: userMessageId },
        role: "assistant",
      },
      orderBy: { id: "asc" },
      include,
    });
    return msg ? toMessage(msg) : null;
  }
}

export const messageRepository = new MessageRepository();
