// src/agents/specialized/prescription.agent.ts
// Prescription Clinical Specialist Agent:
// Analyzes already-extracted prescription records, explains medications to patients,
// checks drug interactions, cross-references allergies, and provides clinical guidance.

import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { type AgentContext } from "../types";
import { prisma } from "../../lib/prisma";
import { decryptJSON } from "../utils/encryption";
import { medicalProfileTool, prescriptionHistoryTool } from "../tools/medical-profile.tool";
import { knowledgeBaseTool } from "../tools/knowledge-base.tool";
import { webSearchTool } from "./web-search.agent";
import { outputComplianceGuardrail } from "../guardrails/output-compliance.guard";
import { getAgentModelName } from "../config/model.provider";

const MODEL_NAME = getAgentModelName();

/**
 * Tool to retrieve the user's latest (or specific) prescription record from the database.
 * Text extraction and structured parsing have already been performed during file upload.
 */
const getLatestPrescriptionTool = tool({
  name: "get_latest_prescription",
  description:
    "Retrieve the patient's latest (or specified) extracted prescription details from the database. " +
    "Returns doctor name, issue date, medications (with dosages, frequency, route), warnings, and recommendations.",
  parameters: z.object({
    userId: z.number().describe("The user ID"),
    prescriptionId: z.string().optional().describe("Optional specific prescription ID"),
    fileId: z.string().optional().describe("Optional specific file ID linked to the prescription"),
  }),
  async execute({ userId, prescriptionId, fileId }) {
    try {
      let prescription;

      if (prescriptionId) {
        prescription = await prisma.prescription.findFirst({
          where: { id: prescriptionId, userId },
          include: { file: { select: { name: true, url: true, createdAt: true } } },
        });
      } else if (fileId) {
        prescription = await prisma.prescription.findFirst({
          where: { fileId, userId },
          include: { file: { select: { name: true, url: true, createdAt: true } } },
        });
      } else {
        prescription = await prisma.prescription.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: { file: { select: { name: true, url: true, createdAt: true } } },
        });
      }

      if (!prescription) {
        return JSON.stringify({
          found: false,
          message: "No prescription records found for this patient. Advise them to upload their prescription document first.",
        });
      }

      return JSON.stringify(
        {
          found: true,
          prescriptionId: prescription.id,
          fileName: prescription.file?.name,
          doctorName: prescription.doctorName || "Not specified",
          patientName: prescription.patientName || "Not specified",
          dateIssued: prescription.dateIssued ? prescription.dateIssued.toISOString().split("T")[0] : "Not specified",
          medications: prescription.medications,
          warnings: prescription.warnings,
          recommendations: prescription.recommendations,
          overallAssessment: prescription.overallAssessment,
          extractionModel: prescription.extractionModel,
          confidenceScore: prescription.confidenceScore,
          uploadedAt: prescription.createdAt,
        },
        null,
        2
      );
    } catch (error) {
      console.error("[Prescription Agent] Error fetching prescription:", error);
      return JSON.stringify({ found: false, error: "Unable to retrieve prescription from database." });
    }
  },
});

/**
 * Tool to retrieve the verbatim OCR extracted text from the original uploaded file.
 * Used when the patient asks about specific doctor notes, clinic stamps, or handwritten annotations.
 */
const getPrescriptionRawDocumentTool = tool({
  name: "get_prescription_raw_document",
  description:
    "Retrieve the complete raw transcribed OCR text from the uploaded prescription document. " +
    "Use this when answering questions about specific handwritten doctor notes, clinic names, addresses, or stamps.",
  parameters: z.object({
    userId: z.number().describe("The user ID"),
    fileId: z.string().optional().describe("Optional specific file ID"),
  }),
  async execute({ userId, fileId }) {
    try {
      const file = fileId
        ? await prisma.file.findFirst({ where: { id: fileId, userId } })
        : await prisma.file.findFirst({
          where: {
            userId,
            prescriptions: { some: {} },
          },
          orderBy: { createdAt: "desc" },
        });

      if (!file) {
        return "No uploaded prescription document found.";
      }

      return JSON.stringify(
        {
          fileId: file.id,
          fileName: file.name,
          uploadedAt: file.createdAt,
          extractedText: file.extractedText || "No text could be extracted from this document.",
        },
        null,
        2
      );
    } catch (error) {
      console.error("[Prescription Agent] Error fetching raw document text:", error);
      return "Unable to retrieve raw document text at this time.";
    }
  },
});

/**
 * Tool to cross-reference prescribed medications against the patient's known allergies
 * and existing medications stored in their encrypted MedicalProfile.
 */
const checkMedicationSafetyTool = tool({
  name: "check_medication_safety",
  description:
    "Cross-reference prescribed medications against the patient's known allergies and existing active medications. " +
    "Use this to identify potential drug-allergy contraindications and duplicate therapies.",
  parameters: z.object({
    userId: z.number().describe("The user ID"),
    medicationNames: z.array(z.string()).describe("List of prescribed medication names to evaluate"),
  }),
  async execute({ userId, medicationNames }) {
    try {
      const profile = await prisma.medicalProfile.findUnique({
        where: { userId },
      });

      let allergies: string[] = [];
      let currentMedications: Array<{ name: string; dosage?: string }> = [];

      if (profile) {
        if (profile.allergiesEncrypted && process.env.ENCRYPTION_MASTER_KEY) {
          try {
            allergies = decryptJSON<string[]>(profile.allergiesEncrypted) || [];
          } catch {
            allergies = [];
          }
        }
        if (profile.medicationsEncrypted && process.env.ENCRYPTION_MASTER_KEY) {
          try {
            currentMedications = decryptJSON<any[]>(profile.medicationsEncrypted) || [];
          } catch {
            currentMedications = [];
          }
        }
      }

      // Check common allergy cross-reactivity patterns
      const allergyAlerts: string[] = [];
      const lowerAllergies = allergies.map((a) => a.toLowerCase());

      for (const drug of medicationNames) {
        const lowerDrug = drug.toLowerCase();

        // Penicillin class allergy check
        if (
          lowerAllergies.some((a) => a.includes("penicillin") || a.includes("amoxicillin") || a.includes("ampicillin"))
        ) {
          if (
            lowerDrug.includes("cillin") ||
            lowerDrug.includes("augmentin") ||
            lowerDrug.includes("amox") ||
            lowerDrug.includes("ampic")
          ) {
            allergyAlerts.push(
              `CRITICAL: Patient has a recorded Penicillin allergy, and ${drug} belongs to the penicillin/beta-lactam class!`
            );
          }
        }

        // Sulfa allergy check
        if (lowerAllergies.some((a) => a.includes("sulfa") || a.includes("sulfonamide"))) {
          if (lowerDrug.includes("sulfa") || lowerDrug.includes("bactrim") || lowerDrug.includes("septra")) {
            allergyAlerts.push(
              `CRITICAL: Patient has a recorded Sulfa allergy, and ${drug} is a sulfonamide medication!`
            );
          }
        }

        // NSAID allergy check
        if (lowerAllergies.some((a) => a.includes("nsaid") || a.includes("aspirin") || a.includes("ibuprofen"))) {
          if (
            lowerDrug.includes("ibuprofen") ||
            lowerDrug.includes("aspirin") ||
            lowerDrug.includes("naproxen") ||
            lowerDrug.includes("diclofenac")
          ) {
            allergyAlerts.push(
              `WARNING: Patient has an NSAID/Aspirin sensitivity, and ${drug} is an NSAID.`
            );
          }
        }
      }

      return JSON.stringify(
        {
          evaluatedMedications: medicationNames,
          patientKnownAllergies: allergies.length > 0 ? allergies : "No recorded allergies",
          patientCurrentMedications: currentMedications.map((m) => m.name || m),
          allergyAlerts,
          hasCriticalAlert: allergyAlerts.length > 0,
          mandatoryNextStep:
            "Always proceed to verify these medications in the curated knowledge base using `search_knowledge_base`. " +
            "If knowledge base has no record or insufficient data, escalate to `search_web`.",
        },
        null,
        2
      );
    } catch (error) {
      console.error("[Prescription Agent] Error checking medication safety:", error);
      return JSON.stringify({ error: "Unable to verify medication safety against profile." });
    }
  },
});

/**
 * Prescription Analyzer Agent.
 * Clinical specialist that explains already-extracted prescription records,
 * details administration instructions, answers patient questions, and checks safety.
 */
export const prescriptionAgent = new Agent<AgentContext>({
  name: "Prescription Analyzer",
  model: MODEL_NAME,

  instructions: `You are MedGPT's Prescription Clinical Specialist & Medication Safety Advisor.

SYSTEM WORKFLOW CONTEXT:
When the patient uploads a prescription file (image or PDF), MedGPT's backend automatically extracts the text, deciphers handwriting via Clinical Vision OCR, and saves structured records (medications, dosages, frequencies, doctor details, and warnings) into the database.
You do NOT need to ask the user to re-type or re-upload their prescription. Instead, use your tools to inspect their already-extracted prescriptions!

YOUR ROLE:
1. Retrieve and review the patient's uploaded prescriptions using \`get_latest_prescription\` or \`get_prescription_history\`.
2. Clearly explain each medication in patient-friendly terms:
   - What the drug is and what condition it typically treats
   - Correct dosage and frequency (clarify abbreviations like BID = twice a day, TID = three times a day, OD = once daily, QHS = bedtime, PRN = as needed, PO = by mouth)
   - When and how to take it (with food, plenty of water, empty stomach)
   - Common side effects and precautions

MANDATORY SAFETY & DRUG INTERACTION VERIFICATION PROTOCOL:
When evaluating medications or addressing safety/interaction questions, you MUST follow this 3-tier clinical verification ladder:
1. TIER 1 (Profile & Allergy Screen):
   - Run \`check_medication_safety\` and \`get_patient_profile\` to cross-check prescribed drugs against the patient's recorded allergies and active medications.
2. TIER 2 (MANDATORY Knowledge Base Check):
   - You MUST ALWAYS call \`search_knowledge_base\` for the prescribed drugs (e.g. query: "[Drug Name] interactions contraindications guidelines" or "[Drug A] [Drug B] drug interaction").
   - This searches our PostgreSQL medical guidelines, hospital data, and curated pharmacological monographs.
3. TIER 3 (Web Search Escalation):
   - If \`search_knowledge_base\` yields NO results, insufficient data, or does not address the specific drug combination/contraindication, you MUST call \`search_web\` to search authoritative medical sources (FDA, NIH, Mayo Clinic, CDC, PubMed) for up-to-date interaction warnings, clinical trials, or black box warnings.
4. SYNTHESIS:
   - Combine results from all tiers into a clear, unified safety review. Highlight any clinically significant interactions, food/alcohol interactions, or special monitoring needs.

DOCUMENT VERIFICATION:
- If the user asks about specific doctor notes, clinic stamps, addresses, or dates, inspect \`get_prescription_raw_document\`.

COMMUNICATION GUIDELINES:
- Be clear, empathetic, and organized with bullet points.
- ALWAYS include a disclaimer: "Please consult your prescribing doctor or pharmacist before making any changes to your medication regimen."
- NEVER tell the patient to discontinue or alter dosages prescribed by their physician.
- If an antibiotic is prescribed, remind them of the importance of completing the full prescribed duration.
- If any critical drug-allergy alert or severe interaction is detected, clearly advise them to contact their physician or pharmacist immediately before taking the medication.`,

  tools: [
    getLatestPrescriptionTool,
    getPrescriptionRawDocumentTool,
    checkMedicationSafetyTool,
    knowledgeBaseTool,
    webSearchTool,
    prescriptionHistoryTool,
    medicalProfileTool,
  ],

  outputGuardrails: [outputComplianceGuardrail],
});
