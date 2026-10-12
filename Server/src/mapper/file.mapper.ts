// src/mappers/file.mapper.ts
import type { File } from "../generated/prisma-client";
import type { FileResponseDto } from "../dto/file.dto";

export const toFileAttachment = (file: File): FileResponseDto => {
    return {
        id: file.id,
        name: file.name,
        mime: file.mime,
        sizeBytes: file.sizeBytes,
        url: file.url,
        status: file.status,
        createdAt: file.createdAt,
    };
}