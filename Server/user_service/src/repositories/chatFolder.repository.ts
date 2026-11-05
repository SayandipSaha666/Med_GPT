import { prisma } from "../lib/prisma";

const include = { assignments: { select: { chatId: true }, orderBy: { sortOrder: "asc" as const } } };

export const chatFolderRepository = {
  list: (userId: number) => prisma.chatFolder.findMany({
    where: { userId }, include, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  }),
  find: (folderId: number, userId: number) => prisma.chatFolder.findFirst({
    where: { id: folderId, userId }, include,
  }),
  create: (userId: number, input: { name: string; icon?: string; color?: string }) =>
    prisma.chatFolder.create({ data: { userId, ...input }, include }),
  update: (folderId: number, input: { name: string; icon?: string; color?: string }) =>
    prisma.chatFolder.update({ where: { id: folderId }, data: input, include }),
  delete: (folderId: number) => prisma.chatFolder.delete({ where: { id: folderId } }),
  addChat: (folderId: number, chatId: number) => prisma.chatFolderAssignment.upsert({
    where: { chatId_folderId: { chatId, folderId } }, update: {}, create: { chatId, folderId },
  }),
  removeChat: (folderId: number, chatId: number) => prisma.chatFolderAssignment.deleteMany({
    where: { chatId, folderId },
  }),
};
