// src/dto/file.dto.ts
import { z } from "zod";

export const FileIdParamDto = z.object({
    id: z.string().uuid(),
});
export type FileIdParamDto = z.infer<typeof FileIdParamDto>;

export const FileResponseDto = z.object({
    id: z.string().uuid(),
    name: z.string(),
    mime: z.string(),
    sizeBytes: z.number(),
    url: z.string().url(),
    status: z.enum(["PROCESSING", "READY", "FAILED"]),
    extractedText: z.string().nullable().optional(),
    errorMessage: z.string().nullable().optional(),
    createdAt: z.date(),
});
export type FileResponseDto = z.infer<typeof FileResponseDto>;