"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileResponseDto = exports.FileIdParamDto = void 0;
// src/dto/file.dto.ts
const zod_1 = require("zod");
exports.FileIdParamDto = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.FileResponseDto = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    mime: zod_1.z.string(),
    sizeBytes: zod_1.z.number(),
    url: zod_1.z.string().url(),
    status: zod_1.z.enum(["PROCESSING", "READY", "FAILED"]),
    extractedText: zod_1.z.string().nullable().optional(),
    errorMessage: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.date(),
});
