// src/agents/types.ts
// Core types and schemas for the MedGPT multi-agent system

import { z } from "zod";

// ─── Department Definitions ───────────────────────────────────────────────────

export const DEPARTMENTS = [
  "general",
  "cardiology",
  "dental",
  "gynecology",
  "ent",
  "dermatology",
  "orthopedic",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// ─── Intent Classification ───────────────────────────────────────────────────

export const INTENTS = [
  "general_medical",
  "department_specific",
  "prescription_analysis",
  "appointment_booking",
  "web_search",
  "emergency",
  "off_topic",
] as const;

export type AgentIntent = (typeof INTENTS)[number];

/**
 * Zod schema used by the Gateway Agent to classify user intent.
 * The agent outputs structured JSON matching this schema.
 */
export const IntentClassificationSchema = z.object({
  intent: z.enum(INTENTS),
  department: z.enum(DEPARTMENTS).optional(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  isEmergency: z.boolean(),
});

export type IntentClassification = z.infer<typeof IntentClassificationSchema>;

// ─── Agent Context (passed to every agent) ───────────────────────────────────

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  agentType?: string;
  timestamp?: Date;
}

export interface MedicalProfileData {
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
}

export interface AgentContext {
  userId: number;
  chatId: number;
  conversationHistory: ConversationMessage[];
  medicalProfile?: MedicalProfileData;
}

// ─── Agent Response Types ────────────────────────────────────────────────────

export interface AgentResult {
  content: string;
  agentType: string;
  confidence: number;
  sources?: Array<{
    snippet?: string;
    source?: string;
    url?: string;
  }>;
  metadata?: Record<string, unknown>;
}

// ─── Guardrail Types ─────────────────────────────────────────────────────────

export const InputSafetySchema = z.object({
  isSafe: z.boolean(),
  reason: z
    .enum([
      "safe",
      "prescription_request",
      "diagnosis_demand",
      "injection_attempt",
      "off_topic",
      "self_harm",
    ])
    .optional(),
  severity: z.enum(["none", "low", "medium", "high", "critical"]).optional(),
});

export type InputSafetyResult = z.infer<typeof InputSafetySchema>;

export const OutputComplianceSchema = z.object({
  isCompliant: z.boolean(),
  hasDisclaimer: z.boolean(),
  hasDefinitiveDiagnosis: z.boolean(),
  hasPrescription: z.boolean(),
  violations: z.array(z.string()),
});

export type OutputComplianceResult = z.infer<typeof OutputComplianceSchema>;

// ─── Prescription Extraction Types ───────────────────────────────────────────

export const MedicationSchema = z.object({
  name: z.string().describe("Drug/medication name"),
  dosage: z.string().describe("Dosage (e.g., 500mg)"),
  frequency: z
    .string()
    .describe("How often (e.g., twice daily, BID, every 8 hours)"),
  duration: z.string().optional().describe("Duration (e.g., 7 days, 2 weeks)"),
  route: z.string().optional().describe("Route (oral, topical, IV, IM)"),
  notes: z.string().optional().describe("Additional notes or instructions"),
});

export type Medication = z.infer<typeof MedicationSchema>;

export const PrescriptionExtractionSchema = z.object({
  patientName: z.string().optional(),
  doctorName: z.string().optional(),
  dateIssued: z.string().optional(),
  medications: z.array(MedicationSchema),
  overallAssessment: z.string(),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
});

export type PrescriptionExtraction = z.infer<
  typeof PrescriptionExtractionSchema
>;

// ─── Appointment Types ───────────────────────────────────────────────────────

export const AppointmentRequestSchema = z.object({
  specialty: z.string(),
  city: z.string(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  urgency: z.enum(["routine", "soon", "urgent"]).optional(),
  reason: z.string().optional(),
});

export type AppointmentRequest = z.infer<typeof AppointmentRequestSchema>;

// ─── Department Agent Configuration ──────────────────────────────────────────

export interface DepartmentAgentConfig {
  name: string;
  department: Department;
  systemPrompt: string;
  fewShotExamples?: Array<{ question: string; answer: string }>;
  additionalTools?: unknown[];
}
