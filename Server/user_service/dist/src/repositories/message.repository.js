"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRepository = exports.MessageRepository = void 0;
const prisma_1 = require("../lib/prisma");
const message_mapper_1 = require("../mapper/message.mapper");
const knowledge_resource_association_1 = require("./knowledge-resource-association");
const include = {
    files: true,
    knowledgeResources: {
        include: { knowledgeEntry: true },
        orderBy: { position: "asc" },
    },
};
class MessageRepository {
    async findById(id) {
        const msg = await prisma_1.prisma.message.findUnique({
            where: { id },
            include,
        });
        return msg ? (0, message_mapper_1.toMessage)(msg) : null;
    }
    async create(data) {
        const { knowledgeEntryIds, ...messageData } = data;
        const distinctIds = [...new Set(knowledgeEntryIds ?? [])];
        const existingEntries = distinctIds.length ? await prisma_1.prisma.knowledgeEntry.findMany({
            where: { id: { in: distinctIds } }, select: { id: true },
        }) : [];
        const linkedIds = (0, knowledge_resource_association_1.matchedKnowledgeResourceIds)(distinctIds, new Set(existingEntries.map((entry) => entry.id)));
        const msg = await prisma_1.prisma.message.create({
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
        return (0, message_mapper_1.toMessage)(msg);
    }
    async findManyByChatId(chatId) {
        const msgs = await prisma_1.prisma.message.findMany({
            where: { chatId },
            include,
            orderBy: { timestamp: "asc" },
        });
        return msgs.map(message_mapper_1.toMessage);
    }
    async findUniqueWhere(where) {
        const msg = await prisma_1.prisma.message.findUnique({
            where,
            include,
        });
        return msg ? (0, message_mapper_1.toMessage)(msg) : null;
    }
    async updateAgentMetadata(messageId, data) {
        await prisma_1.prisma.message.update({
            where: { id: messageId },
            data: {
                agentType: data.agentType ?? undefined,
                confidence: data.confidence ?? undefined,
            },
        });
    }
    async deleteById(id) {
        await prisma_1.prisma.message.delete({
            where: { id },
        });
    }
    async deleteManyByIds(ids) {
        await prisma_1.prisma.message.deleteMany({
            where: { id: { in: ids } },
        });
    }
    async updateContent(id, content) {
        const msg = await prisma_1.prisma.message.update({
            where: { id },
            data: { content },
            include,
        });
        return (0, message_mapper_1.toMessage)(msg);
    }
    async findNextAssistantMessage(chatId, userMessageId) {
        const msg = await prisma_1.prisma.message.findFirst({
            where: {
                chatId,
                id: { gt: userMessageId },
                role: "assistant",
            },
            orderBy: { id: "asc" },
            include,
        });
        return msg ? (0, message_mapper_1.toMessage)(msg) : null;
    }
}
exports.MessageRepository = MessageRepository;
exports.messageRepository = new MessageRepository();
