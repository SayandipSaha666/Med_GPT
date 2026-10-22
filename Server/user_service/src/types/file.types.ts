export const ALLOWED_MIME_TYPES = [
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
] as const;

export type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number];

export interface UploadedAsset {
    url: string;
    publicId: string;
    resourceType: string;
}

export interface UploadFileInput {
    userId: number;
    buffer: Buffer;
    originalName: string;
    mime: string;
    size: number;
}

export interface CreateFileData {
    userId: number;
    name: string;
    mime: string;
    sizeBytes: number;
    url: string;
    publicId: string;
    resourceType: string;
}