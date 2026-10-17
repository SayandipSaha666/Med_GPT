// src/agents/departments/department-agent.factory.ts
// Factory function that creates department-specialized agents using
// the same base LLM but with domain-specific prompts, RAG filters, and tools.
//
// Groq support: When MODEL_PROVIDER=groq, this uses qwen/qwen-2-7b via GroqCloud.

import { Agent } from "@openai/agents";
import { createRagRetrievalTool } from "../tools/rag-retrieval.tool";
import {
  medicalProfileTool,
  prescriptionHistoryTool,
} from "../tools/medical-profile.tool";
import { pastConsultationsTool } from "../tools/past-consultations.tool";
import { knowledgeBaseTool } from "../tools/knowledge-base.tool";
import { outputComplianceGuardrail } from "../guardrails/output-compliance.guard";
import { getAgentModelName } from "../../config/model.provider";
import type { AgentContext, DepartmentAgentConfig } from "../types";

// Model name based on configured provider (OpenAI or Groq)
const MODEL_NAME = getAgentModelName();

/**
 * Creates a department-specific agent with:
 * - Domain-specific system prompt (from prompts.ts)
 * - RAG tool filtered to the department's Pinecone namespace (semantic search)
 * - Knowledge base tool for PostgreSQL knowledge entries (keyword/structured search)
 * - Medical profile tool for personalized responses (encrypted PII)
 * - Prescription history tool for medication context
 * - Output compliance guardrail (disclaimer + no-diagnosis checks)
 *
 * All department agents use the same base model (gpt-4o or qwen-2-7b) —
 * specialization comes from prompts and filtered retrieval.
 *
 * The agent decides WHICH tools to call based on the query:
 * - Simple factual question → search_medical_knowledge (Pinecone)
 * - Drug/guideline question → search_knowledge_base (PostgreSQL)
 * - Personalized question  → get_patient_profile + get_prescription_history
 * - Complex question        → multiple tools, LLM combines results
 */
export function createDepartmentAgent(
  config: DepartmentAgentConfig
): Agent<AgentContext> {
  const departmentRagTool = createRagRetrievalTool(config.department);

  return new Agent<AgentContext>({
    name: config.name,
    model: MODEL_NAME,

    instructions: config.systemPrompt,

    tools: [
      departmentRagTool,       // Pinecone vector similarity search
      knowledgeBaseTool,       // PostgreSQL knowledge entries (web search results, guidelines)
      medicalProfileTool,      // User's encrypted medical profile
      prescriptionHistoryTool, // User's prescription history
      pastConsultationsTool,   // Cross-chat consultation memory (Layer B)
      ...(config.additionalTools || []),
    ],

    outputGuardrails: [outputComplianceGuardrail],
  });
}
