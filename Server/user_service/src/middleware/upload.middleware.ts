// src/middlewares/upload.middleware.ts
import multer from "multer";
import { env } from '../../config/env';
import { ALLOWED_MIME_TYPES } from "../types/file.types";
import { AppError } from "../errors/app-error";

export const uploadSingle = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        if ((ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype)) return cb(null, true);
        cb(AppError.badRequest(`Unsupported file type: ${file.mimetype}`));
    },
}).single("file");