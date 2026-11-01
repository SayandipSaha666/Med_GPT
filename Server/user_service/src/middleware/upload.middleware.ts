// src/middlewares/upload.middleware.ts
/*
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
*/

import multer from "multer";
import type { RequestHandler } from "express";
// import { fileTypeFromBuffer } from "file-type";

import { env } from "../../config/env";
import { ALLOWED_MIME_TYPES } from "../types/file.types";
import { AppError } from "../errors/app-error";

const MAX_FILE_SIZE = env.MAX_FILE_SIZE_MB * 1024 * 1024;

const allowedMimeTypes = new Set<string>(ALLOWED_MIME_TYPES);

// Multer configuration
const multerUpload = multer({
    storage: multer.memoryStorage(),
    
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
        fields: 10,
        parts: 11,
    },
    
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(
                AppError.badRequest(
                    `Unsupported file type: ${file.mimetype}`
                )
            );
        }
        
        cb(null, true);
    },
}).single("file");

// Wrapper to handle Multer-specific errors
export const uploadSingle: RequestHandler = (
    req,
    res,
    next
) => {
    multerUpload(req, res, (error) => {
        if (!error) {
            return next();
        }
        
        if (error instanceof multer.MulterError) {
            switch (error.code) {
                case "LIMIT_FILE_SIZE":
                    return next(
                        AppError.badRequest(
                            `File size exceeds the maximum limit of ${env.MAX_FILE_SIZE_MB} MB`
                        )
                    );
                    
                    case "LIMIT_FILE_COUNT":
                        case "LIMIT_UNEXPECTED_FILE":
                    return next(
                        AppError.badRequest(
                            "Only one file is allowed"
                        )
                    );

                    case "LIMIT_PART_COUNT":
                        case "LIMIT_FIELD_COUNT":
                            return next(
                                AppError.badRequest(
                                    "Too many multipart fields"
                                )
                            );
                            
                            default:
                                return next(
                                    AppError.badRequest(
                                        "Invalid file upload request"
                                    )
                                );
                            }
        }

        return next(error);
    });
};

// Validate actual file contents using magic bytes
export const validateUploadedFile: RequestHandler = async (
    req,
    _res,
    next
) => {
    try {
        const file = req.file;
        
        if (!file) {
            return next(
                AppError.badRequest("File is required")
            );
        }

        const { fileTypeFromBuffer } = await import("file-type");
        const detectedType = await fileTypeFromBuffer(
            file.buffer
        );

        if (!detectedType) {
            return next(
                AppError.badRequest(
                    "Unable to determine the actual file type"
                )
            );
        }

        // Compare detected binary MIME type against
        // the MIME type supplied by the client.
        if (detectedType.mime !== file.mimetype) {
            return next(
                AppError.badRequest(
                    "File content does not match its declared MIME type"
                )
            );
        }

        // Check actual detected MIME against allowed types.
        if (!allowedMimeTypes.has(detectedType.mime)) {
            return next(
                AppError.badRequest(
                    `Unsupported file content: ${detectedType.mime}`
                )
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};
