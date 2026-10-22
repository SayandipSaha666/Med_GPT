// src/agents/tools/rag-retrieval.tool.ts
// Tool that allows agents to query the existing RAG pipeline
// (the Python/FastAPI service) for context retrieval.

import { tool } from "@openai/agents";
import { z } from "zod";
import { env } from "../../../config/env";
import type { Department } from "../types";

const RAG_SERVICE_URL = env.RAG_SERVICE_URL || "http://localhost:8000";

/**
 * Creates a department-filtered RAG retrieval tool.
 * Each department agent gets its own instance that prefixes
 * queries with department context for better retrieval.
 */
export function createRagRetrievalTool(department: Department) {
  return tool({
    name: "search_medical_knowledge",
    description: `Search the medical knowledge base for information relevant to ${department}. Use this to find evidence-based medical information to support your responses.`,
    parameters: z.object({
      query: z
        .string()
        .describe("The medical question or topic to search for"),
      includeContext: z
        .boolean()
        .default(true)
        .describe(
          "Whether to include surrounding context from matched documents"
        ),
    }),
    async execute({ query, includeContext }) {
      try {
        // Prefix with department for better retrieval relevance
        const enhancedQuery =
          department !== "general"
            ? `[${department}] ${query}`
            : query;

        const response = await fetch(`${RAG_SERVICE_URL}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: enhancedQuery }),
        });

        if (!response.ok) {
          return `Knowledge base search returned an error (status ${response.status}). I'll answer based on my training knowledge.`;
        }

        const data = await response.json();
        const sources = data.sources || [];

        let result = `**Knowledge Base Results:**\n${data.answer}`;

        if (includeContext && sources.length > 0) {
          result += `\n\n**Sources:**\n`;
          for (const source of sources.slice(0, 3)) {
            result += `- ${source.snippet?.substring(0, 200) || "N/A"} (${source.source || "Unknown source"})\n`;
          }
        }

        return result;
      } catch (error) {
        console.error("[RAG Tool] Error querying knowledge base:", error);
        return "Knowledge base is temporarily unavailable. I'll provide information based on my training knowledge.";
      }
    },
  });
}

/**
 * A general-purpose RAG tool (no department filter).
 */
export const generalRagTool = createRagRetrievalTool("general");
