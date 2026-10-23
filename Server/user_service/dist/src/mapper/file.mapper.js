"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFileAttachment = void 0;
const toFileAttachment = (file) => {
    return {
        id: file.id,
        name: file.name,
        mime: file.mime,
        sizeBytes: file.sizeBytes,
        url: file.url,
        status: file.status,
        extractedText: file.extractedText,
        errorMessage: file.errorMessage,
        createdAt: file.createdAt,
    };
};
exports.toFileAttachment = toFileAttachment;
