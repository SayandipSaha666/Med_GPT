// src/agents/tools/past-consultations.tool.ts
// Tool for Cross-Chat Memory Retrieval (Layer B):
// Searches structured consultation summaries (ChatSummary table) across all previous chats
// so agents can instantly recall past symptoms, diagnoses, advice, and medications.

import { tool } from "@openai/agents";
import { z } from "zod";
import { chatSummaryRepository } from "../../repositories/chat-summary.repository";

export const pastConsultationsTool = tool({
  name: "search_past_consultations",
  description:
    "Search previous consultation summaries for this patient across earlier chats. " +
    "Use this to recall past symptoms, previous diagnoses discussed, clinical advice given, " +
    "or medications mentioned in earlier conversations with the patient.",
  parameters: z.object({
    userId: z.number().describe("The user ID"),
    query: z.string().describe("Symptom, condition, diagnosis, or medication to search across previous consultations"),
    department: z
      .string()
      .optional()
      .describe("Optional department filter (e.g., 'cardiology', 'general', 'dental', 'orthopedic')"),
    currentChatId: z.number().optional().describe("The current chat ID to exclude from past history"),
  }),
  async execute({ userId, query, department, currentChatId }) {
    try {
      const summaries = await chatSummaryRepository.searchSummaries(
        userId,
        query,
        currentChatId,
        department,
        3
      );

      if (summaries.length === 0) {
        return `No past consultation summaries found matching "${query}".`;
      }

      const results = summaries.map((s) => ({
        chatId: s.chatId,
        date: s.updatedAt.toISOString().split("T")[0],
        department: s.primaryDepartment || "general",
        chiefComplaints: s.chiefComplaints,
        diagnosesDiscussed: s.diagnosesDiscussed,
        clinicalAdvice: s.clinicalAdvice,
        medicationsMentioned: s.medicationsMentioned,
        allergiesNoted: s.allergiesNoted,
        urgencyLevel: s.urgencyLevel,
        compactedSummary: s.compactedText,
      }));

      return JSON.stringify(results, null, 2);
    } catch (error) {
      console.error("[Past Consultations Tool] Error searching summaries:", error);
      return "Unable to search past consultations at this time.";
    }
  },
});
