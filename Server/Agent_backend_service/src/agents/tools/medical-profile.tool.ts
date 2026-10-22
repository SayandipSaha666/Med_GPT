// src/agents/tools/medical-profile.tool.ts
// Tool that allows agents to read the user's medical profile
// (decrypted at the application layer) for personalized responses.

import { tool } from "@openai/agents";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { decryptField } from "../utils/encryption";

/**
 * Tool for agents to access the user's medical profile.
 * Returns decrypted PII only to the agent (never logged raw).
 */
export const medicalProfileTool = tool({
  name: "get_patient_profile",
  description:
    "Retrieve the patient's medical profile including allergies, conditions, " +
    "current medications, and health history. Use this to personalize your " +
    "medical advice and check for contraindications.",
  parameters: z.object({
    userId: z.number().describe("The user's ID"),
    fields: z
      .array(
        z.enum([
          "allergies",
          "conditions",
          "medications",
          "blood_group",
          "gender",
          "age",
        ])
      )
      .optional()
      .describe(
        "Specific fields to retrieve. If omitted, returns all available fields."
      ),
  }),
  async execute({ userId, fields }) {
    try {
      const profile = await prisma.medicalProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        return "No medical profile found for this patient. You may want to ask about their relevant medical history, allergies, and current medications.";
      }

      const result: Record<string, unknown> = {};
      const requestedFields = fields || [
        "allergies",
        "conditions",
        "medications",
        "blood_group",
        "gender",
        "age",
      ];

      for (const field of requestedFields) {
        switch (field) {
          case "allergies":
            if (profile.allergiesEncrypted) {
              try {
                result.allergies = JSON.parse(
                  decryptField(profile.allergiesEncrypted)
                );
              } catch {
                result.allergies = [];
              }
            } else {
              result.allergies = [];
            }
            break;

          case "conditions":
            if (profile.conditionsEncrypted) {
              try {
                result.conditions = JSON.parse(
                  decryptField(profile.conditionsEncrypted)
                );
              } catch {
                result.conditions = [];
              }
            } else {
              result.conditions = [];
            }
            break;

          case "medications":
            if (profile.medicationsEncrypted) {
              try {
                result.medications = JSON.parse(
                  decryptField(profile.medicationsEncrypted)
                );
              } catch {
                result.medications = [];
              }
            } else {
              result.medications = [];
            }
            break;

          case "blood_group":
            result.bloodGroup = profile.bloodGroup || "Not provided";
            break;

          case "gender":
            result.gender = profile.gender || "Not provided";
            break;

          case "age":
            if (profile.dateOfBirth) {
              try {
                const dob = decryptField(profile.dateOfBirth);
                const birthDate = new Date(dob);
                const age = Math.floor(
                  (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                );
                result.age = age;
              } catch {
                result.age = "Not available";
              }
            } else {
              result.age = "Not provided";
            }
            break;
        }
      }

      return JSON.stringify(result, null, 2);
    } catch (error) {
      console.error("[Medical Profile Tool] Error:", error);
      return "Unable to retrieve medical profile at this time. Please ask the patient directly about relevant medical history.";
    }
  },
});

/**
 * Tool for agents to check prescription history for a user.
 */
export const prescriptionHistoryTool = tool({
  name: "get_prescription_history",
  description:
    "Retrieve the patient's recent prescription analysis history. " +
    "Use this to check for drug interactions or understand their current medication regimen.",
  parameters: z.object({
    userId: z.number().describe("The user's ID"),
    limit: z
      .number()
      .default(5)
      .describe("Maximum number of recent prescriptions to return"),
  }),
  async execute({ userId, limit }) {
    try {
      const prescriptions = await prisma.prescription.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          doctorName: true,
          dateIssued: true,
          medications: true,
          warnings: true,
          overallAssessment: true,
          createdAt: true,
        },
      });

      if (prescriptions.length === 0) {
        return "No prescription history found for this patient.";
      }

      return JSON.stringify(prescriptions, null, 2);
    } catch (error) {
      console.error("[Prescription History Tool] Error:", error);
      return "Unable to retrieve prescription history at this time.";
    }
  },
});
