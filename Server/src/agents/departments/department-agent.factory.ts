// src/agents/departments/department-agent.factory.ts
// Factory function that creates department-specialized agents using
// the same base LLM but with domain-specific prompts, RAG filters, and tools.

import { Agent } from "@openai/agents";
import { createRagRetrievalTool } from "../tools/rag-retrieval.tool";
import {
  medicalProfileTool,
  prescriptionHistoryTool,
} from "../tools/medical-profile.tool";
import { knowledgeBaseTool } from "../tools/knowledge-base.tool";
import { outputComplianceGuardrail } from "../guardrails/output-compliance.guard";
import type { AgentContext, DepartmentAgentConfig } from "../types";

/**
 * Creates a department-specific agent with:
 * - Domain-specific system prompt (from prompts.ts)
 * - RAG tool filtered to the department's Pinecone namespace (semantic search)
 * - Knowledge base tool for PostgreSQL knowledge entries (keyword/structured search)
 * - Medical profile tool for personalized responses (encrypted PII)
 * - Prescription history tool for medication context
 * - Output compliance guardrail (disclaimer + no-diagnosis checks)
 *
 * All department agents use the same base model (gpt-4o) —
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
    model: "gpt-4o",

    instructions: config.systemPrompt,

    tools: [
      departmentRagTool,       // Pinecone vector similarity search
      knowledgeBaseTool,       // PostgreSQL knowledge entries (web search results, guidelines)
      medicalProfileTool,      // User's encrypted medical profile
      prescriptionHistoryTool, // User's prescription history
      ...(config.additionalTools || []),
    ],

    outputGuardrails: [outputComplianceGuardrail],
  });
}
