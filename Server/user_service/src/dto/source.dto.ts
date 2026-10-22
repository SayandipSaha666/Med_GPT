// src/dto/source.dto.ts
export type SourceType = "file" | "web";   // add "tool" | "database" later

interface BaseSource {
    /** 1-based citation number. The model writes [1], [2] in the answer text. */
    index: number;
    title: string;
    snippet?: string;
}

export interface FileSource extends BaseSource {
    type: "file";
    fileId: string;
    fileName: string;
    url: string;          // Cloudinary preview URL
    mime: string;
    chunkIdx?: number;    // which chunk matched (RAG)
}

export interface WebSource extends BaseSource {
    type: "web";
    url: string;
    domain: string;       // "who.int", for the chip label
    faviconUrl?: string;
    publishedAt?: Date;
}

export type Source = FileSource | WebSource;

// Type guards, handy in services and the UI
export const isFileSource = (s: Source): s is FileSource => s.type === "file";
export const isWebSource = (s: Source): s is WebSource => s.type === "web";