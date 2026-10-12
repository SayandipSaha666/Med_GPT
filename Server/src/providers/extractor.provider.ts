// src/providers/extractor.provider.ts
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export interface ExtractorProvider {
    extractText(buffer: Buffer, mime: string): Promise<string>;
    chunk(text: string, size?: number, overlap?: number): string[];
}

export class DefaultExtractorProvider implements ExtractorProvider {
    async extractText(buffer: Buffer, mime: string): Promise<string> {
        switch (mime) {
            case "application/pdf": {
                const parser = new PDFParse({ data: buffer });
                const result = await parser.getText();
                return result.text;
            }
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                return (await mammoth.extractRawText({ buffer })).value;
            case "text/plain":
            case "text/markdown":
            case "text/csv":
                return buffer.toString("utf-8");
            default:
                return ""; // images: use a vision model or add OCR here
        }
    }

    chunk(text: string, size = 1500, overlap = 200): string[] {
        if (!text) return [];
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += size - overlap) {
            chunks.push(text.slice(i, i + size));
        }
        return chunks;
    }
}

export const extractorProvider: ExtractorProvider = new DefaultExtractorProvider();