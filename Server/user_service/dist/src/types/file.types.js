"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_MIME_TYPES = void 0;
exports.ALLOWED_MIME_TYPES = [
    // Documents
    "text/plain", // .txt
    "application/pdf", // .pdf
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    // Images - including WebP for modern web format support
    "image/png", // .png
    "image/jpeg", // .jpg, .jpeg
    "image/gif", // .gif
    "image/webp", // .webp - Modern web image format with better compression
];
