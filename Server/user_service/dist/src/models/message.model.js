"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageModel = exports.MessageModel = void 0;
// Message model
const prisma_1 = require("../lib/prisma");
class MessageModel {
    async findById(id) {
        return prisma_1.prisma.message.findUnique({ where: { id } });
    }
    async create(data) {
        return prisma_1.prisma.message.create({ data });
    }
    async findManyByChatId(chatId) {
        return prisma_1.prisma.message.findMany({
            where: { chatId },
            orderBy: { timestamp: "asc" },
        });
    }
}
exports.MessageModel = MessageModel;
exports.messageModel = new MessageModel();
