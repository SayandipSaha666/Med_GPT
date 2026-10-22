// src/agents/tools/knowledge-base.tool.ts
// Tool that searches the PostgreSQL knowledge_entries table.
// This gives agents access to stored web search results, uploaded
// document content, and admin-curated medical guidelines.
//
// This is DIFFERENT from the RAG tool (Pinecone):
// - Pinecone = semantic similarity ("find things like X")
// - This tool = structured search with filters ("find entries about
//   Omeprazole from verified sources in cardiology department")

import { tool } from "@openai/agents";
import { z } from "zod";
import { prisma } from "../../lib/prisma";

/**
 * Search the knowledge base for relevant medical information.
 * Uses PostgreSQL full-text search + structured filters.
 *
 * When to use vs. Pinecone RAG tool:
 * - Use THIS tool when you need specific, verified knowledge entries
 *   (e.g., drug info, guidelines, hospital data)
 * - Use Pinecone RAG when you need broad semantic matching
 *   (e.g., "what conditions cause chest pain?")
 * - For complex queries, the agent calls BOTH
 */
export const knowledgeBaseTool = tool({
  name: "search_knowledge_base",
  description:
    "Search the curated medical knowledge base for specific information. " +
    "This searches stored web research, medical guidelines, uploaded documents, " +
    "and verified medical content. Use this alongside the vector search tool " +
    "for comprehensive answers. Prefer this tool for drug-specific info, " +
    "guidelines, and verified content.",
  parameters: z.object({
    query: z.string().describe("Search query (keywords or natural language)"),
    department: z
      .string()
      .optional()
      .describe("Filter by department (e.g., 'cardiology', 'dental')"),
    source: z
      .enum([
        "WEB_SEARCH",
        "UPLOADED_DOCUMENT",
        "MEDICAL_GUIDELINE",
        "HOSPITAL_DATA",
        "AGENT_LEARNING",
        "MANUAL_ENTRY",
      ])
      .optional()
      .describe("Filter by knowledge source type"),
    verifiedOnly: z
      .boolean()
      .default(false)
      .describe("If true, only return human-verified entries"),
    maxResults: z
      .number()
      .default(5)
      .describe("Maximum number of results to return"),
  }),
  async execute({ query, department, source, verifiedOnly, maxResults }) {
    try {
      // Build the WHERE clause dynamically
      const where: Record<string, unknown> = {};

      if (department) {
        where.department = department;
      }
      if (source) {
        where.source = source;
      }
      if (verifiedOnly) {
        where.isVerified = true;
      }

      // Search using PostgreSQL ILIKE for keyword matching
      // In production, upgrade to pg_trgm or full-text search (tsvector)
      const keywords = query
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .slice(0, 5);

      if (keywords.length > 0) {
        where.OR = keywords.map((keyword) => ({
          OR: [
            { title: { contains: keyword, mode: "insensitive" as const } },
            { content: { contains: keyword, mode: "insensitive" as const } },
            { tags: { has: keyword.toLowerCase() } },
          ],
        }));
      }

      const entries = await prisma.knowledgeEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: maxResults,
        select: {
          title: true,
          content: true,
          source: true,
          sourceUrl: true,
          department: true,
          isVerified: true,
          tags: true,
          createdAt: true,
        },
      });

      if (entries.length === 0) {
        return `No knowledge base entries found for "${query}"${department ? ` in ${department}` : ""}. Consider using the web search tool for current information.`;
      }

      const formatted = entries.map((entry, i) => {
        const verifiedBadge = entry.isVerified ? " ✅ Verified" : "";
        return (
          `**[${i + 1}] ${entry.title}**${verifiedBadge}\n` +
          `Source: ${entry.source}${entry.sourceUrl ? ` (${entry.sourceUrl})` : ""}\n` +
          `Department: ${entry.department || "General"}\n` +
          `Content: ${entry.content.substring(0, 500)}${entry.content.length > 500 ? "..." : ""}\n` +
          `Tags: ${entry.tags.join(", ") || "none"}`
        );
      });

      return `Knowledge Base Results (${entries.length} found):\n\n${formatted.join("\n\n---\n\n")}`;
    } catch (error) {
      console.error("[Knowledge Base Tool] Error:", error);
      return "Knowledge base search is temporarily unavailable.";
    }
  },
});

/**
 * Tool to save new knowledge from web search or agent discoveries.
 * Called by the web search agent or knowledge ingestion pipeline
 * to persist useful information for future queries.
 */
export const saveKnowledgeTool = tool({
  name: "save_to_knowledge_base",
  description:
    "Save a piece of useful medical information to the knowledge base " +
    "for future reference. Use this when you find valuable information " +
    "from web search that should be remembered for future queries.",
  parameters: z.object({
    title: z.string().describe("A descriptive title for this knowledge entry"),
    content: z.string().describe("The full text content to save"),
    sourceUrl: z
      .string()
      .optional()
      .describe("URL where this information was found"),
    department: z
      .string()
      .optional()
      .describe("Medical department this relates to"),
    tags: z
      .array(z.string())
      .default([])
      .describe("Tags for categorization (e.g., 'omeprazole', 'GERD', 'side-effects')"),
  }),
  async execute({ title, content, sourceUrl, department, tags }) {
    try {
      // Generate content hash for deduplication
      const crypto = await import("crypto");
      const contentHash = crypto
        .createHash("sha256")
        .update(content)
        .digest("hex");

      // Check for duplicate
      const existing = await prisma.knowledgeEntry.findUnique({
        where: { contentHash },
      });

      if (existing) {
        return `This information already exists in the knowledge base (title: "${existing.title}"). No duplicate created.`;
      }

      const entry = await prisma.knowledgeEntry.create({
        data: {
          title,
          content,
          contentHash,
          source: "WEB_SEARCH",
          sourceUrl,
          department,
          tags: tags.map((t) => t.toLowerCase()),
          isVerified: false, // Requires human review
        },
      });

      return `Knowledge saved successfully (ID: ${entry.id}). Title: "${title}". This entry will be available for future queries. Note: It is marked as unverified until reviewed by an admin.`;
    } catch (error) {
      console.error("[Save Knowledge Tool] Error:", error);
      return "Failed to save knowledge entry. The information is still available in this conversation.";
    }
  },
});
