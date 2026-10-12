// src/services/file.service.ts
import { fileRepository } from "../repositories/file.repository";
import { storageProvider } from "../providers/storage.provider";
import { fileProcessingService } from "./file-processing.service";
import { toFileAttachment } from "../mapper/file.mapper";
import { AppError } from "../errors/app-error";
import type { UploadFileInput } from "../types/file.types";
import type { FileResponseDto } from "../dto/file.dto";

export class FileService {
    async upload(input: UploadFileInput): Promise<FileResponseDto> {
        // 1. Store original in cloud storage
        const asset = await storageProvider.upload(input.buffer);

        // 2. Persist metadata (status = PROCESSING)
        let file;
        try {
            file = await fileRepository.create({
                userId: input.userId,
                name: input.originalName,
                mime: input.mime,
                sizeBytes: input.size,
                url: asset.url,
                publicId: asset.publicId,
                resourceType: asset.resourceType,
            });
        } catch (err) {
            // avoid orphaned cloud files if the DB insert fails
            await storageProvider.remove(asset.publicId, asset.resourceType).catch(() => { });
            throw err;
        }

        // 3. Extract in background (do not await)
        void fileProcessingService.process(file.id, input.buffer, input.mime);

        return toFileAttachment(file);
    }

    async getById(id: string, userId: number): Promise<FileResponseDto> {
        const file = await fileRepository.findByIdForUser(id, userId);
        if (!file) throw AppError.notFound("File not found");
        return toFileAttachment(file);
    }

    async list(userId: number): Promise<FileResponseDto[]> {
        const files = await fileRepository.listByUser(userId);
        return files.map(toFileAttachment);
    }

    async remove(id: string, userId: number): Promise<void> {
        const file = await fileRepository.findByIdForUser(id, userId);
        if (!file) throw AppError.notFound("File not found");

        await storageProvider.remove(file.publicId, file.resourceType);
        await fileRepository.delete(file.id);
    }
}

export const fileService = new FileService();