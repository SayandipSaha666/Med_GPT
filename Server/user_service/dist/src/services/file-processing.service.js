"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileProcessingService = exports.FileProcessingService = void 0;
// src/services/file-processing.service.ts
const file_repository_1 = require("../repositories/file.repository");
const file_chunk_repository_1 = require("../repositories/file-chunk.repository");
const extractor_provider_1 = require("../providers/extractor.provider");
const prisma_1 = require("../lib/prisma");
const encryption_1 = require("../utils/encryption");
class FileProcessingService {
    /** Runs after the upload response is sent (background). */
    async process(fileId, buffer, mime, userId) {
        const startTime = Date.now();
        try {
            // Resolve userId if not provided directly
            let resolvedUserId = userId;
            if (!resolvedUserId) {
                const fileRecord = await file_repository_1.fileRepository.findById(fileId);
                resolvedUserId = fileRecord?.userId;
            }
            // 1. Extract text and structured prescription details
            const result = await extractor_provider_1.extractorProvider.extract(buffer, mime);
            let text = (result.rawText || "").trim();
            // If rawText was empty but prescription data was structured, construct fallback text
            if (!text && result.prescriptionData) {
                const rx = result.prescriptionData;
                const medLines = rx.medications.map((m) => `- ${m.name} ${m.dosage} (${m.frequency})`).join("\n");
                text = `Prescription Analysis:\nDoctor: ${rx.doctorName || "Not specified"}\nPatient: ${rx.patientName || "Not specified"}\nDate: ${rx.dateIssued || "Not specified"}\n\nMedications:\n${medLines}\n\nAssessment: ${rx.overallAssessment || "N/A"}`;
            }
            // 2. Chunk text and persist chunks
            const chunks = extractor_provider_1.extractorProvider.chunk(text);
            if (chunks.length) {
                await file_chunk_repository_1.fileChunkRepository.replaceForFile(fileId, chunks);
            }
            // 3. Mark File record as READY with extracted text
            const updatedFile = await file_repository_1.fileRepository.markReady(fileId, text);
            console.log(`[FileProcessing] File ${fileId} marked READY. Extracted text length: ${text.length}`);
            // 4. If structured prescription details were detected, save to Prescription model
            const rx = result.prescriptionData;
            if (rx && resolvedUserId) {
                const processingTimeMs = Date.now() - startTime;
                try {
                    await prisma_1.prisma.prescription.create({
                        data: {
                            userId: resolvedUserId,
                            fileId,
                            doctorName: rx.doctorName || null,
                            patientName: rx.patientName || null,
                            dateIssued: rx.dateIssued ? new Date(rx.dateIssued) : null,
                            rawText: text,
                            medications: (rx.medications || []),
                            warnings: (rx.warnings || []),
                            recommendations: (rx.recommendations || []),
                            overallAssessment: rx.overallAssessment || null,
                            extractionModel: rx.extractionModel || "vlm-ocr",
                            confidenceScore: rx.confidenceScore || 0.85,
                            processingTimeMs,
                        },
                    });
                    console.log(`[FileProcessing] Prescription record created for file ${fileId} (User ${resolvedUserId})`);
                }
                catch (rxErr) {
                    console.error(`[FileProcessing] Failed to create Prescription record for file ${fileId}:`, rxErr);
                }
                // 5. If medications are present, sync with MedicalProfile
                if (rx.medications && rx.medications.length > 0) {
                    await this.syncMedicalProfile(resolvedUserId, rx.medications);
                }
            }
        }
        catch (err) {
            console.error(`Processing failed for file ${fileId}`, err);
            await file_repository_1.fileRepository.markFailed(fileId, err instanceof Error ? err.message : "Unknown processing error");
        }
    }
    /**
     * Safely updates or creates the user's MedicalProfile with encrypted medications
     */
    async syncMedicalProfile(userId, newMedications) {
        try {
            if (!process.env.ENCRYPTION_MASTER_KEY) {
                console.info("[FileProcessing] ENCRYPTION_MASTER_KEY is not set. Skipping MedicalProfile sync.");
                return;
            }
            const profile = await prisma_1.prisma.medicalProfile.findUnique({
                where: { userId },
            });
            let existingMeds = [];
            if (profile?.medicationsEncrypted) {
                try {
                    existingMeds = (0, encryption_1.decryptJSON)(profile.medicationsEncrypted) || [];
                }
                catch (decErr) {
                    console.warn("[FileProcessing] Could not decrypt existing medications in MedicalProfile:", decErr);
                    existingMeds = [];
                }
            }
            // Deduplicate and merge medications by name
            const mergedMeds = [...existingMeds];
            for (const newMed of newMedications) {
                if (!newMed.name)
                    continue;
                const exists = mergedMeds.some((m) => m.name && m.name.toLowerCase() === newMed.name.toLowerCase());
                if (!exists) {
                    mergedMeds.push(newMed);
                }
            }
            const encryptedMeds = (0, encryption_1.encryptJSON)(mergedMeds);
            await prisma_1.prisma.medicalProfile.upsert({
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
        }
        catch (profileErr) {
            console.error(`[FileProcessing] Error syncing MedicalProfile for user ${userId}:`, profileErr);
        }
    }
}
exports.FileProcessingService = FileProcessingService;
exports.fileProcessingService = new FileProcessingService();
