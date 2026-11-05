"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatFolderService = void 0;
const prisma_1 = require("../lib/prisma");
const chatFolder_repository_1 = require("../repositories/chatFolder.repository");
function toDto(folder) {
    const { assignments, ...fields } = folder;
    return { ...fields, chatIds: assignments.map((assignment) => assignment.chatId) };
}
async function ownedFolder(folderId, userId) {
    const folder = await chatFolder_repository_1.chatFolderRepository.find(folderId, userId);
    if (!folder)
        throw new Error("Folder not found");
    return folder;
}
exports.chatFolderService = {
    async list(userId) {
        return (await chatFolder_repository_1.chatFolderRepository.list(userId)).map(toDto);
    },
    async create(userId, input) {
        return toDto(await chatFolder_repository_1.chatFolderRepository.create(userId, input));
    },
    async update(folderId, userId, input) {
        await ownedFolder(folderId, userId);
        return toDto(await chatFolder_repository_1.chatFolderRepository.update(folderId, input));
    },
    async delete(folderId, userId) {
        await ownedFolder(folderId, userId);
        await chatFolder_repository_1.chatFolderRepository.delete(folderId);
    },
    async addChat(folderId, chatId, userId) {
        await ownedFolder(folderId, userId);
        const chat = await prisma_1.prisma.chat.findFirst({ where: { id: chatId, userId }, select: { id: true } });
        if (!chat)
            throw new Error("Chat not found");
        await chatFolder_repository_1.chatFolderRepository.addChat(folderId, chatId);
        return toDto((await chatFolder_repository_1.chatFolderRepository.find(folderId, userId)));
    },
    async removeChat(folderId, chatId, userId) {
        await ownedFolder(folderId, userId);
        const chat = await prisma_1.prisma.chat.findFirst({ where: { id: chatId, userId }, select: { id: true } });
        if (!chat)
            throw new Error("Chat not found");
        await chatFolder_repository_1.chatFolderRepository.removeChat(folderId, chatId);
        return toDto((await chatFolder_repository_1.chatFolderRepository.find(folderId, userId)));
    },
};
