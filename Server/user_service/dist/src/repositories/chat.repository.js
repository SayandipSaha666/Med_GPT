"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRepository = exports.ChatRepository = void 0;
const prisma_1 = require("../lib/prisma");
class ChatRepository {
    async findById(id) {
        return prisma_1.prisma.chat.findUnique({
            where: { id },
            include: { summary: true },
        });
    }
    async findByUserId(userId) {
        return prisma_1.prisma.chat.findMany({
            where: { userId },
            include: {
                messages: {
                    take: 1,
                    orderBy: { timestamp: "desc" },
                },
                summary: true,
            },
        });
    }
    async create(data) {
        return prisma_1.prisma.chat.create({
            data,
        });
    }
    async delete(id) {
        await prisma_1.prisma.chat.delete({
            where: { id },
        });
    }
    async update(id, data) {
        return prisma_1.prisma.chat.update({
            where: { id },
            data,
        });
    }
}
exports.ChatRepository = ChatRepository;
exports.chatRepository = new ChatRepository();
