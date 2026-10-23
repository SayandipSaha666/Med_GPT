"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileService = exports.FileService = void 0;
// src/services/file.service.ts
const file_repository_1 = require("../repositories/file.repository");
const storage_provider_1 = require("../providers/storage.provider");
const file_processing_service_1 = require("./file-processing.service");
const file_mapper_1 = require("../mapper/file.mapper");
const app_error_1 = require("../errors/app-error");
class FileService {
    async upload(input) {
        // 1. Store original in cloud storage
        const asset = await storage_provider_1.storageProvider.upload(input.buffer);
        // 2. Persist metadata (status = PROCESSING)
        let file;
        try {
            file = await file_repository_1.fileRepository.create({
                userId: input.userId,
                name: input.originalName,
                mime: input.mime,
                sizeBytes: input.size,
                url: asset.url,
                publicId: asset.publicId,
                resourceType: asset.resourceType,
            });
        }
        catch (err) {
            // avoid orphaned cloud files if the DB insert fails
            await storage_provider_1.storageProvider.remove(asset.publicId, asset.resourceType).catch(() => { });
            throw err;
        }
        // 3. Extract in background (do not await)
        void file_processing_service_1.fileProcessingService.process(file.id, input.buffer, input.mime, file.userId);
        return (0, file_mapper_1.toFileAttachment)(file);
    }
    async getById(id, userId) {
        const file = await file_repository_1.fileRepository.findByIdForUser(id, userId);
        if (!file)
            throw app_error_1.AppError.notFound("File not found");
        return (0, file_mapper_1.toFileAttachment)(file);
    }
    async list(userId) {
        const files = await file_repository_1.fileRepository.listByUser(userId);
        return files.map(file_mapper_1.toFileAttachment);
    }
    async remove(id, userId) {
        const file = await file_repository_1.fileRepository.findByIdForUser(id, userId);
        if (!file)
            throw app_error_1.AppError.notFound("File not found");
        await storage_provider_1.storageProvider.remove(file.publicId, file.resourceType);
        await file_repository_1.fileRepository.delete(file.id);
    }
}
exports.FileService = FileService;
exports.fileService = new FileService();
