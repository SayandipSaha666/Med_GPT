"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatSummaryRepository = exports.ChatSummaryRepository = void 0;
// src/repositories/chat-summary.repository.ts
const prisma_1 = require("../lib/prisma");
class ChatSummaryRepository {
    async findByChatId(chatId) {
        return prisma_1.prisma.chatSummary.findUnique({
            where: { chatId },
        });
    }
    async upsert(chatId, input) {
        return prisma_1.prisma.chatSummary.upsert({
            where: { chatId },
            create: {
                chatId,
                userId: input.userId,
                chiefComplaints: input.chiefComplaints || [],
                symptomsDetail: input.symptomsDetail || null,
                diagnosesDiscussed: input.diagnosesDiscussed || [],
                clinicalAdvice: input.clinicalAdvice || null,
                medicationsMentioned: input.medicationsMentioned || [],
                allergiesNoted: input.allergiesNoted || [],
                primaryDepartment: input.primaryDepartment || null,
                urgencyLevel: input.urgencyLevel || "routine",
                pendingActions: input.pendingActions || [],
                compactedText: input.compactedText,
                messageCountAtCompaction: input.messageCountAtCompaction,
            },
            update: {
                chiefComplaints: input.chiefComplaints || [],
                symptomsDetail: input.symptomsDetail || null,
                diagnosesDiscussed: input.diagnosesDiscussed || [],
                clinicalAdvice: input.clinicalAdvice || null,
                medicationsMentioned: input.medicationsMentioned || [],
                allergiesNoted: input.allergiesNoted || [],
                primaryDepartment: input.primaryDepartment || null,
                urgencyLevel: input.urgencyLevel || "routine",
                pendingActions: input.pendingActions || [],
                compactedText: input.compactedText,
                messageCountAtCompaction: input.messageCountAtCompaction,
            },
        });
    }
    async searchSummaries(userId, query, currentChatId, department, limit = 4) {
        const cleanQuery = query.trim().toLowerCase();
        return prisma_1.prisma.chatSummary.findMany({
            where: {
                userId,
                chatId: currentChatId ? { not: currentChatId } : undefined,
                primaryDepartment: department ? { equals: department, mode: "insensitive" } : undefined,
                OR: [
                    { chiefComplaints: { hasSome: [cleanQuery] } },
                    { diagnosesDiscussed: { hasSome: [cleanQuery] } },
                    { allergiesNoted: { hasSome: [cleanQuery] } },
                    { symptomsDetail: { contains: cleanQuery, mode: "insensitive" } },
                    { clinicalAdvice: { contains: cleanQuery, mode: "insensitive" } },
                    { compactedText: { contains: cleanQuery, mode: "insensitive" } },
                ],
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
        });
    }
    async listByUserId(userId, limit = 10) {
        return prisma_1.prisma.chatSummary.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: limit,
        });
    }
}
exports.ChatSummaryRepository = ChatSummaryRepository;
exports.chatSummaryRepository = new ChatSummaryRepository();
