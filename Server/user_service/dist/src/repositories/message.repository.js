"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRepository = exports.MessageRepository = void 0;
const prisma_1 = require("../lib/prisma");
const message_mapper_1 = require("../mapper/message.mapper");
class MessageRepository {
    async findById(id) {
        const msg = await prisma_1.prisma.message.findUnique({
            where: { id },
            include: { files: true },
        });
        return msg ? (0, message_mapper_1.toMessage)(msg) : null;
    }
    async create(data) {
        const msg = await prisma_1.prisma.message.create({
            data,
            include: { files: true },
        });
        return (0, message_mapper_1.toMessage)(msg);
    }
    async findManyByChatId(chatId) {
        const msgs = await prisma_1.prisma.message.findMany({
            where: { chatId },
            include: { files: true },
            orderBy: { timestamp: "asc" },
        });
        return msgs.map(message_mapper_1.toMessage);
    }
    async findUniqueWhere(where) {
        const msg = await prisma_1.prisma.message.findUnique({
            where,
            include: { files: true },
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
            include: { files: true },
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
            include: { files: true },
        });
        return msg ? (0, message_mapper_1.toMessage)(msg) : null;
    }
}
exports.MessageRepository = MessageRepository;
exports.messageRepository = new MessageRepository();
