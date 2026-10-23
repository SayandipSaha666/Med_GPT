"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatModel = exports.ChatModel = void 0;
// Chat model
const prisma_1 = require("../lib/prisma");
class ChatModel {
    async findById(id) {
        return prisma_1.prisma.chat.findUnique({ where: { id } });
    }
    async findByUserId(userId) {
        return prisma_1.prisma.chat.findMany({
            where: { userId },
            include: {
                messages: {
                    take: 1,
                    orderBy: { timestamp: "desc" },
                },
            },
        });
    }
    async create(data) {
        return prisma_1.prisma.chat.create({ data });
    }
    async delete(id) {
        return prisma_1.prisma.chat.delete({ where: { id } });
    }
    async update(id, data) {
        return prisma_1.prisma.chat.update({ where: { id }, data });
    }
}
exports.ChatModel = ChatModel;
exports.chatModel = new ChatModel();
