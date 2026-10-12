// src/repositories/file.repository.ts
import type { File, FileStatus } from "../generated/prisma-client";
import { prisma } from "../lib/prisma";
import type { CreateFileData } from "../types/file.types";

export class FileRepository {
    create(data: CreateFileData): Promise<File> {
        return prisma.file.create({ data });
    }

    findByIdForUser(id: string, userId: number): Promise<File | null> {
        return prisma.file.findFirst({ where: { id, userId } });
    }

    findManyByIdsForUser(ids: string[], userId: number): Promise<File[]> {
        if (!ids.length) return Promise.resolve([]);
        return prisma.file.findMany({ where: { id: { in: ids }, userId } });
    }

    listByUser(userId: number): Promise<File[]> {
        return prisma.file.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }

    markReady(id: string, extractedText: string): Promise<File> {
        return prisma.file.update({
            where: { id },
            data: { extractedText, status: "READY" satisfies FileStatus },
        });
    }

    markFailed(id: string, errorMessage: string): Promise<File> {
        return prisma.file.update({
            where: { id },
            data: { status: "FAILED" satisfies FileStatus, errorMessage },
        });
    }

    delete(id: string): Promise<File> {
        return prisma.file.delete({ where: { id } });
    }
}

export const fileRepository = new FileRepository();