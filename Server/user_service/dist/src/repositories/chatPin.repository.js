"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatPinRepository = void 0;
const prisma_1 = require("../lib/prisma");
exports.chatPinRepository = {
    list: (userId) => prisma_1.prisma.chatPin.findMany({
        where: { userId }, orderBy: { pinnedAt: "desc" },
        select: { chatId: true, pinnedAt: true },
    }),
    pin: (chatId, userId) => prisma_1.prisma.chatPin.upsert({
        where: { chatId },
        update: {},
        create: { chatId, userId },
        select: { chatId: true, pinnedAt: true },
    }),
    unpin: (chatId, userId) => prisma_1.prisma.chatPin.deleteMany({
        where: { chatId, userId },
    }),
};
