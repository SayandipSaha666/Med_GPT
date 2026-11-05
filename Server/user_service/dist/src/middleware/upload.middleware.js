"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUploadedFile = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
// import { fileTypeFromBuffer } from "file-type";
const env_1 = require("../../config/env");
const file_types_1 = require("../types/file.types");
const app_error_1 = require("../errors/app-error");
const MAX_FILE_SIZE = env_1.env.MAX_FILE_SIZE_MB * 1024 * 1024;
const allowedMimeTypes = new Set(file_types_1.ALLOWED_MIME_TYPES);
// Multer configuration
const multerUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
        fields: 10,
        parts: 11,
    },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(app_error_1.AppError.badRequest(`Unsupported file type: ${file.mimetype}`));
        }
        cb(null, true);
    },
}).single("file");
// Wrapper to handle Multer-specific errors
const uploadSingle = (req, res, next) => {
    multerUpload(req, res, (error) => {
        if (!error) {
            return next();
        }
        if (error instanceof multer_1.default.MulterError) {
            switch (error.code) {
                case "LIMIT_FILE_SIZE":
                    return next(app_error_1.AppError.badRequest(`File size exceeds the maximum limit of ${env_1.env.MAX_FILE_SIZE_MB} MB`));
                case "LIMIT_FILE_COUNT":
                case "LIMIT_UNEXPECTED_FILE":
                    return next(app_error_1.AppError.badRequest("Only one file is allowed"));
                case "LIMIT_PART_COUNT":
                case "LIMIT_FIELD_COUNT":
                    return next(app_error_1.AppError.badRequest("Too many multipart fields"));
                default:
                    return next(app_error_1.AppError.badRequest("Invalid file upload request"));
            }
        }
        return next(error);
    });
};
exports.uploadSingle = uploadSingle;
// Validate actual file contents using magic bytes
const validateUploadedFile = async (req, _res, next) => {
    try {
        const file = req.file;
        if (!file) {
            return next(app_error_1.AppError.badRequest("File is required"));
        }
        const { fileTypeFromBuffer } = await import("file-type");
        const detectedType = await fileTypeFromBuffer(file.buffer);
        if (!detectedType) {
            return next(app_error_1.AppError.badRequest("Unable to determine the actual file type"));
        }
        // Compare detected binary MIME type against
        // the MIME type supplied by the client.
        if (detectedType.mime !== file.mimetype) {
            return next(app_error_1.AppError.badRequest("File content does not match its declared MIME type"));
        }
        // Check actual detected MIME against allowed types.
        if (!allowedMimeTypes.has(detectedType.mime)) {
            return next(app_error_1.AppError.badRequest(`Unsupported file content: ${detectedType.mime}`));
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateUploadedFile = validateUploadedFile;
