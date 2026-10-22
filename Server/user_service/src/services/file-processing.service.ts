// src/services/file-processing.service.ts
import { fileRepository } from "../repositories/file.repository";
import { fileChunkRepository } from "../repositories/file-chunk.repository";
import { extractorProvider } from "../providers/extractor.provider";
import { prisma } from "../lib/prisma";
import { encryptJSON, decryptJSON } from "../utils/encryption";

export class FileProcessingService {
    /** Runs after the upload response is sent (background). */
    async process(fileId: string, buffer: Buffer, mime: string, userId?: number): Promise<void> {
        const startTime = Date.now();
        try {
            // Resolve userId if not provided directly
            let resolvedUserId = userId;
            if (!resolvedUserId) {
                const fileRecord = await fileRepository.findById(fileId);
                resolvedUserId = fileRecord?.userId;
            }

            // 1. Extract text and structured prescription details
            const result = await extractorProvider.extract(buffer, mime);
            let text = (result.rawText || "").trim();

            // If rawText was empty but prescription data was structured, construct fallback text
            if (!text && result.prescriptionData) {
                const rx = result.prescriptionData;
                const medLines = rx.medications.map((m) => `- ${m.name} ${m.dosage} (${m.frequency})`).join("\n");
                text = `Prescription Analysis:\nDoctor: ${rx.doctorName || "Not specified"}\nPatient: ${rx.patientName || "Not specified"}\nDate: ${rx.dateIssued || "Not specified"}\n\nMedications:\n${medLines}\n\nAssessment: ${rx.overallAssessment || "N/A"}`;
            }

            // 2. Chunk text and persist chunks
            const chunks = extractorProvider.chunk(text);
            if (chunks.length) {
                await fileChunkRepository.replaceForFile(fileId, chunks);
            }

            // 3. Mark File record as READY with extracted text
            const updatedFile = await fileRepository.markReady(fileId, text);
            console.log(`[FileProcessing] File ${fileId} marked READY. Extracted text length: ${text.length}`);

            // 4. If structured prescription details were detected, save to Prescription model
            const rx = result.prescriptionData;
            if (rx && resolvedUserId) {
                const processingTimeMs = Date.now() - startTime;
                try {
                    await prisma.prescription.create({
                        data: {
                            userId: resolvedUserId,
                            fileId,
                            doctorName: rx.doctorName || null,
                            patientName: rx.patientName || null,
                            dateIssued: rx.dateIssued ? new Date(rx.dateIssued) : null,
                            rawText: text,
                            medications: (rx.medications || []) as any,
                            warnings: (rx.warnings || []) as any,
                            recommendations: (rx.recommendations || []) as any,
                            overallAssessment: rx.overallAssessment || null,
                            extractionModel: rx.extractionModel || "vlm-ocr",
                            confidenceScore: rx.confidenceScore || 0.85,
                            processingTimeMs,
                        },
                    });
                    console.log(`[FileProcessing] Prescription record created for file ${fileId} (User ${resolvedUserId})`);
                } catch (rxErr) {
                    console.error(`[FileProcessing] Failed to create Prescription record for file ${fileId}:`, rxErr);
                }

                // 5. If medications are present, sync with MedicalProfile
                if (rx.medications && rx.medications.length > 0) {
                    await this.syncMedicalProfile(resolvedUserId, rx.medications);
                }
            }
        } catch (err) {
            console.error(`Processing failed for file ${fileId}`, err);
            await fileRepository.markFailed(
                fileId,
                err instanceof Error ? err.message : "Unknown processing error"
            );
        }
    }

    /**
     * Safely updates or creates the user's MedicalProfile with encrypted medications
     */
    private async syncMedicalProfile(
        userId: number,
        newMedications: Array<{ name: string; dosage?: string; frequency?: string }>
    ): Promise<void> {
        try {
            if (!process.env.ENCRYPTION_MASTER_KEY) {
                console.info("[FileProcessing] ENCRYPTION_MASTER_KEY is not set. Skipping MedicalProfile sync.");
                return;
            }

            const profile = await prisma.medicalProfile.findUnique({
                where: { userId },
            });

            let existingMeds: any[] = [];
            if (profile?.medicationsEncrypted) {
                try {
                    existingMeds = decryptJSON<any[]>(profile.medicationsEncrypted) || [];
                } catch (decErr) {
                    console.warn("[FileProcessing] Could not decrypt existing medications in MedicalProfile:", decErr);
                    existingMeds = [];
                }
            }

            // Deduplicate and merge medications by name
            const mergedMeds = [...existingMeds];
            for (const newMed of newMedications) {
                if (!newMed.name) continue;
                const exists = mergedMeds.some(
                    (m) => m.name && m.name.toLowerCase() === newMed.name.toLowerCase()
                );
                if (!exists) {
                    mergedMeds.push(newMed);
                }
            }

            const encryptedMeds = encryptJSON(mergedMeds);

            await prisma.medicalProfile.upsert({
                where: { userId },
                create: {
                    userId,
                    medicationsEncrypted: encryptedMeds,
                },
                update: {
                    medicationsEncrypted: encryptedMeds,
                },
            });

            console.log(`[FileProcessing] MedicalProfile updated for user ${userId} with ${mergedMeds.length} total medications.`);
        } catch (profileErr) {
            console.error(`[FileProcessing] Error syncing MedicalProfile for user ${userId}:`, profileErr);
        }
    }
}

export const fileProcessingService = new FileProcessingService();