import { prisma } from "../lib/prisma";

export const chatPinRepository = {
  list: (userId: number) => prisma.chatPin.findMany({
    where: { userId }, orderBy: { pinnedAt: "desc" },
    select: { chatId: true, pinnedAt: true },
  }),
  pin: (chatId: number, userId: number) => prisma.chatPin.upsert({
    where: { chatId },
    update: {},
    create: { chatId, userId },
    select: { chatId: true, pinnedAt: true },
  }),
  unpin: (chatId: number, userId: number) => prisma.chatPin.deleteMany({
    where: { chatId, userId },
  }),
};
