// src/agents/specialized/prescription.agent.ts
// Prescription analysis agent: extracts structured medication data
// from prescription images/PDFs using VLM (GPT-4o Vision).

import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { PrescriptionExtractionSchema, type AgentContext } from "../types";
import { outputComplianceGuardrail } from "../guardrails/output-compliance.guard";

/**
 * Tool that performs the actual VLM-based prescription extraction.
 * In Phase 1, this calls the Python RAG service or OpenAI Vision API directly.
 * The extracted text from FileChunks (already in your DB) is passed in.
 */
const extractFromText = tool({
  name: "extract_prescription_data",
  description:
    "Extract structured medication data from prescription text. " +
    "Use this when you receive raw OCR text from a prescription image or PDF.",
  parameters: z.object({
    rawText: z.string().describe("The raw OCR/extracted text from the prescription"),
  }),
  async execute({ rawText }) {
    // The LLM agent itself will structure this — this tool just
    // validates and returns the text for the agent to parse.
    // In production, you could add a formulary lookup here.
    return `Raw prescription text for analysis:\n\n${rawText}`;
  },
});

/**
 * Tool to validate extracted drug names against a known formulary.
 * Catches OCR misreads (e.g., "Amoxicillin" vs "Amitriptyline").
 */
const validateDrugNames = tool({
  name: "validate_drug_names",
  description:
    "Validate extracted drug names against a medical formulary database. " +
    "Use this to verify that OCR-extracted drug names are real medications.",
  parameters: z.object({
    drugNames: z
      .array(z.string())
      .describe("List of drug names to validate"),
  }),
  async execute({ drugNames }) {
    // TODO: In production, query a drug database API (e.g., RxNorm, OpenFDA)
    // For now, return the names with a note to verify
    const results = drugNames.map((name) => ({
      name,
      status: "unverified",
      note: "Drug name extracted — recommend verification with pharmacist",
    }));

    return JSON.stringify(results, null, 2);
  },
});

/**
 * Prescription Analyzer Agent.
 * Takes raw text from an uploaded prescription and extracts
 * structured medication data with warnings and recommendations.
 */
export const prescriptionAgent = new Agent<AgentContext>({
  name: "Prescription Analyzer",
  model: "gpt-4o",

  instructions: `You are MedGPT's Prescription Analyzer specialist.

Your job is to analyze prescription text (from OCR extraction of prescription images/PDFs)
and extract structured medication information.

WORKFLOW:
1. Receive the raw text extracted from a prescription
2. Identify all medications, their dosages, frequencies, and durations
3. Validate drug names using the validation tool
4. Check for potential issues:
   - Unusually high or low dosages
   - Common drug interactions between listed medications
   - Allergies from the patient's profile
5. Provide a clear, patient-friendly summary

OUTPUT FORMAT:
Provide your analysis in a clear format with:
- List of medications with dosage, frequency, duration
- Any warnings or concerns
- Recommendations (always include "consult your doctor/pharmacist")
- Your confidence level in the extraction accuracy

CRITICAL RULES:
- NEVER tell the patient to change their medication
- NEVER adjust dosages — only flag concerns for their doctor
- If you're unsure about a drug name (OCR may have errors), say so
- ALWAYS recommend discussing the prescription with their pharmacist
- For unclear handwriting extractions, note which items need verification`,

  tools: [extractFromText, validateDrugNames],

  outputGuardrails: [outputComplianceGuardrail],
});
