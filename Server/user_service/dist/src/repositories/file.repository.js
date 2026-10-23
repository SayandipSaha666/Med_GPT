"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileRepository = exports.FileRepository = void 0;
const prisma_1 = require("../lib/prisma");
class FileRepository {
    create(data) {
        return prisma_1.prisma.file.create({ data });
    }
    findById(id) {
        return prisma_1.prisma.file.findUnique({ where: { id } });
    }
    findByIdForUser(id, userId) {
        return prisma_1.prisma.file.findFirst({ where: { id, userId } });
    }
    findManyByIdsForUser(ids, userId) {
        if (!ids.length)
            return Promise.resolve([]);
        return prisma_1.prisma.file.findMany({ where: { id: { in: ids }, userId } });
    }
    listByUser(userId) {
        return prisma_1.prisma.file.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
    markReady(id, extractedText) {
        return prisma_1.prisma.file.update({
            where: { id },
            data: { extractedText, status: "READY" },
        });
    }
    markFailed(id, errorMessage) {
        return prisma_1.prisma.file.update({
            where: { id },
            data: { status: "FAILED", errorMessage },
        });
    }
    delete(id) {
        return prisma_1.prisma.file.delete({ where: { id } });
    }
}
exports.FileRepository = FileRepository;
exports.fileRepository = new FileRepository();
