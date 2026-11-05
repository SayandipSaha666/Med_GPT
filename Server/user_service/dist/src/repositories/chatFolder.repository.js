"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatFolderRepository = void 0;
const prisma_1 = require("../lib/prisma");
const include = { assignments: { select: { chatId: true }, orderBy: { sortOrder: "asc" } } };
exports.chatFolderRepository = {
    list: (userId) => prisma_1.prisma.chatFolder.findMany({
        where: { userId }, include, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    find: (folderId, userId) => prisma_1.prisma.chatFolder.findFirst({
        where: { id: folderId, userId }, include,
    }),
    create: (userId, input) => prisma_1.prisma.chatFolder.create({ data: { userId, ...input }, include }),
    update: (folderId, input) => prisma_1.prisma.chatFolder.update({ where: { id: folderId }, data: input, include }),
    delete: (folderId) => prisma_1.prisma.chatFolder.delete({ where: { id: folderId } }),
    addChat: (folderId, chatId) => prisma_1.prisma.chatFolderAssignment.upsert({
        where: { chatId_folderId: { chatId, folderId } }, update: {}, create: { chatId, folderId },
    }),
    removeChat: (folderId, chatId) => prisma_1.prisma.chatFolderAssignment.deleteMany({
        where: { chatId, folderId },
    }),
};
