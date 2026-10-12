// src/services/file-processing.service.ts
import { fileRepository } from "../repositories/file.repository";
import { fileChunkRepository } from "../repositories/file-chunk.repository";
import { extractorProvider } from "../providers/extractor.provider";

export class FileProcessingService {
    /** Runs after the upload response is sent (background). */
    async process(fileId: string, buffer: Buffer, mime: string): Promise<void> {
        try {
            const text = await extractorProvider.extractText(buffer, mime);
            const chunks = extractorProvider.chunk(text);

            if (chunks.length) await fileChunkRepository.replaceForFile(fileId, chunks);
            await fileRepository.markReady(fileId, text);
        } catch (err) {
            console.error(`Processing failed for file ${fileId}`, err);
            await fileRepository.markFailed(
                fileId,
                err instanceof Error ? err.message : "Unknown processing error"
            );
        }
    }
}

export const fileProcessingService = new FileProcessingService();