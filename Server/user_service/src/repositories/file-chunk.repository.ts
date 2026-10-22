// src/repositories/file-chunk.repository.ts
import { prisma } from "../lib/prisma";

export class FileChunkRepository {
    async replaceForFile(fileId: string, chunks: string[]): Promise<void> {
        await prisma.$transaction([
            prisma.fileChunk.deleteMany({ where: { fileId } }),
            prisma.fileChunk.createMany({
                data: chunks.map((content, idx) => ({ fileId, idx, content })),
            }),
        ]);
    }
}

export const fileChunkRepository = new FileChunkRepository();