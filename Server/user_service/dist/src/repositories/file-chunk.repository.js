"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileChunkRepository = exports.FileChunkRepository = void 0;
// src/repositories/file-chunk.repository.ts
const prisma_1 = require("../lib/prisma");
class FileChunkRepository {
    async replaceForFile(fileId, chunks) {
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.fileChunk.deleteMany({ where: { fileId } }),
            prisma_1.prisma.fileChunk.createMany({
                data: chunks.map((content, idx) => ({ fileId, idx, content })),
            }),
        ]);
    }
}
exports.FileChunkRepository = FileChunkRepository;
exports.fileChunkRepository = new FileChunkRepository();
