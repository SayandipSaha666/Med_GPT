import { prisma } from "../lib/prisma";
import { chatFolderRepository } from "../repositories/chatFolder.repository";

type FolderInput = { name: string; icon?: string; color?: string };

function toDto(folder: Awaited<ReturnType<typeof chatFolderRepository.create>>) {
  const { assignments, ...fields } = folder;
  return { ...fields, chatIds: assignments.map((assignment) => assignment.chatId) };
}

async function ownedFolder(folderId: number, userId: number) {
  const folder = await chatFolderRepository.find(folderId, userId);
  if (!folder) throw new Error("Folder not found");
  return folder;
}

export const chatFolderService = {
  async list(userId: number) {
    return (await chatFolderRepository.list(userId)).map(toDto);
  },
  async create(userId: number, input: FolderInput) {
    return toDto(await chatFolderRepository.create(userId, input));
  },
  async update(folderId: number, userId: number, input: FolderInput) {
    await ownedFolder(folderId, userId);
    return toDto(await chatFolderRepository.update(folderId, input));
  },
  async delete(folderId: number, userId: number) {
    await ownedFolder(folderId, userId);
    await chatFolderRepository.delete(folderId);
  },
  async addChat(folderId: number, chatId: number, userId: number) {
    await ownedFolder(folderId, userId);
    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId }, select: { id: true } });
    if (!chat) throw new Error("Chat not found");
    await chatFolderRepository.addChat(folderId, chatId);
    return toDto((await chatFolderRepository.find(folderId, userId))!);
  },
  async removeChat(folderId: number, chatId: number, userId: number) {
    await ownedFolder(folderId, userId);
    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId }, select: { id: true } });
    if (!chat) throw new Error("Chat not found");
    await chatFolderRepository.removeChat(folderId, chatId);
    return toDto((await chatFolderRepository.find(folderId, userId))!);
  },
};
