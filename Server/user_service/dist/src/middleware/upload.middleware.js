"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingle = void 0;
// src/middlewares/upload.middleware.ts
const multer_1 = __importDefault(require("multer"));
const env_1 = require("../../config/env");
const file_types_1 = require("../types/file.types");
const app_error_1 = require("../errors/app-error");
exports.uploadSingle = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: env_1.env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
        if (file_types_1.ALLOWED_MIME_TYPES.includes(file.mimetype))
            return cb(null, true);
        cb(app_error_1.AppError.badRequest(`Unsupported file type: ${file.mimetype}`));
    },
}).single("file");
