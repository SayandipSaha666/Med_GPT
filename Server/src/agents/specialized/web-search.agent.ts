// src/agents/specialized/web-search.agent.ts
// Web search agent: searches the internet for current medical information,
// drug alerts, hospital details, and latest guidelines.

import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import type { AgentContext } from "../types";
import {
  knowledgeBaseTool,
  saveKnowledgeTool,
} from "../tools/knowledge-base.tool";


/**
 * Web search tool using SerpAPI or Google Custom Search.
 * Results are cached in Redis (when available) to reduce API calls.
 */
const webSearchTool = tool({
  name: "search_web",
  description:
    "Search the web for current medical information, drug alerts, " +
    "latest guidelines, hospital details, or news. Use this when the " +
    "knowledge base doesn't have up-to-date information.",
  parameters: z.object({
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .default(5)
      .describe("Maximum number of results to return"),
  }),
  async execute({ query, maxResults }) {
    try {
      const apiKey = process.env.SERPAPI_KEY || process.env.GOOGLE_SEARCH_API_KEY;

      if (!apiKey) {
        return "Web search is not configured. Please set SERPAPI_KEY or GOOGLE_SEARCH_API_KEY in environment variables.";
      }

      // SerpAPI integration
      if (process.env.SERPAPI_KEY) {
        const params = new URLSearchParams({
          api_key: process.env.SERPAPI_KEY,
          q: `${query} site:nih.gov OR site:who.int OR site:mayoclinic.org OR site:webmd.com`,
          num: String(maxResults),
          engine: "google",
        });

        const response = await fetch(
          `https://serpapi.com/search?${params.toString()}`
        );

        if (!response.ok) {
          return `Web search returned status ${response.status}. Using knowledge base only.`;
        }

        const data = await response.json();
        const results = (data.organic_results || [])
          .slice(0, maxResults)
          .map(
            (r: { title: string; snippet: string; link: string }) =>
              `**${r.title}**\n${r.snippet}\nSource: ${r.link}`
          );

        return results.length > 0
          ? `Web search results:\n\n${results.join("\n\n---\n\n")}`
          : "No relevant web results found for this query.";
      }

      // Google Custom Search API fallback
      if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
        const params = new URLSearchParams({
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_CX,
          q: query,
          num: String(Math.min(maxResults, 10)),
        });

        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?${params.toString()}`
        );

        if (!response.ok) {
          return `Web search returned status ${response.status}. Using knowledge base only.`;
        }

        const data = await response.json();
        const results = (data.items || [])
          .slice(0, maxResults)
          .map(
            (r: { title: string; snippet: string; link: string }) =>
              `**${r.title}**\n${r.snippet}\nSource: ${r.link}`
          );

        return results.length > 0
          ? `Web search results:\n\n${results.join("\n\n---\n\n")}`
          : "No relevant web results found for this query.";
      }

      return "Web search is not configured. No search API keys found.";
    } catch (error) {
      console.error("[Web Search Tool] Error:", error);
      return "Web search failed due to a network error. I'll answer based on my training knowledge.";
    }
  },
});

/**
 * Fetch and extract readable content from a URL.
 */
const fetchPageContent = tool({
  name: "fetch_page_content",
  description:
    "Fetch and extract readable text content from a specific URL. " +
    "Use this after web_search to get more detailed information from a source.",
  parameters: z.object({
    url: z.string().describe("The URL to fetch content from"),
    maxLength: z
      .number()
      .default(3000)
      .describe("Maximum characters to return"),
  }),
  async execute({ url, maxLength }) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MedGPT/1.0; Medical Research Bot)",
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        return `Failed to fetch URL (status ${response.status}).`;
      }

      const html = await response.text();

      // Basic HTML → text extraction (strip tags)
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return text.substring(0, maxLength);
    } catch (error) {
      console.error("[Fetch Page Tool] Error:", error);
      return "Failed to fetch page content.";
    }
  },
});

/**
 * Web Search Agent.
 * Searches the internet for current medical information
 * and synthesizes findings into medical context.
 */
export const webSearchAgent = new Agent<AgentContext>({
  name: "Medical Web Search Specialist",
  model: "gpt-4o",

  instructions: `You are MedGPT's Web Search specialist.

Your job is to find current, reliable medical information from the internet
when the knowledge base doesn't have up-to-date answers.

WORKFLOW:
1. FIRST: Search the existing knowledge base (search_knowledge_base tool)
   — We may already have this information from a previous search
2. If knowledge base results are insufficient, search the web
3. Formulate effective search queries (use medical terminology)
4. If needed, fetch full content from the most relevant sources
5. SAVE useful findings to the knowledge base (save_to_knowledge_base tool)
   — This builds our knowledge over time for future queries
6. Synthesize findings into a clear, evidence-based response

TRUSTED SOURCES (prioritize these):
- NIH (nih.gov)
- WHO (who.int)
- Mayo Clinic (mayoclinic.org)
- CDC (cdc.gov)
- PubMed / NCBI
- Cleveland Clinic
- WebMD (for patient-friendly info)
- FDA (for drug information)

CRITICAL RULES:
- Always cite your sources with URLs
- Distinguish between established medical consensus and emerging research
- Note when information is from a specific country/region (guidelines may vary)
- Do not present internet findings as definitive medical advice
- Always recommend consulting a healthcare provider
- SAVE noteworthy findings to the knowledge base with appropriate tags`,

  tools: [
    knowledgeBaseTool,    // Search existing knowledge in PostgreSQL first
    webSearchTool,        // Search the web for new information
    fetchPageContent,     // Fetch detailed content from URLs
    saveKnowledgeTool,    // Save useful findings for future queries
  ],
});
