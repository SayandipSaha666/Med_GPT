// src/repositories/chat-summary.repository.ts
import { prisma } from "../../lib/prisma";
import type { ChatSummary } from "../../generated/prisma-client";

export interface UpsertChatSummaryInput {
    userId: number;
    chiefComplaints?: string[];
    symptomsDetail?: string | null;
    diagnosesDiscussed?: string[];
    clinicalAdvice?: string | null;
    medicationsMentioned?: any;
    allergiesNoted?: string[];
    primaryDepartment?: string | null;
    urgencyLevel?: string;
    pendingActions?: string[];
    compactedText: string;
    messageCountAtCompaction: number;
}

export class ChatSummaryRepository {
    async findByChatId(chatId: number): Promise<ChatSummary | null> {
        return prisma.chatSummary.findUnique({
            where: { chatId },
        });
    }

    async upsert(chatId: number, input: UpsertChatSummaryInput): Promise<ChatSummary> {
        return prisma.chatSummary.upsert({
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

    async searchSummaries(
        userId: number,
        query: string,
        currentChatId?: number,
        department?: string,
        limit = 4
    ): Promise<ChatSummary[]> {
        const cleanQuery = query.trim().toLowerCase();

        return prisma.chatSummary.findMany({
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

    async listByUserId(userId: number, limit = 10): Promise<ChatSummary[]> {
        return prisma.chatSummary.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: limit,
        });
    }
}

export const chatSummaryRepository = new ChatSummaryRepository();
