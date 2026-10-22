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
import { getAgentModelName } from "../config/model.provider";

const MODEL_NAME = getAgentModelName();


/**
 * Web search tool using SerpAPI or Google Custom Search.
 * Results are cached in Redis (when available) to reduce API calls.
 */

type SearchResult = {
  title: string;
  snippet: string;
  link: string;
};

type SearchProvider = "SerpAPI" | "Google Custom Search";

export const webSearchTool = tool({
  name: "search_web",
  description:
    "Search for current medical information, drug alerts, guidelines, " +
    "hospital details, or news. Use when the knowledge base is insufficient.",

  parameters: z.object({
    query: z.string().min(1).describe("The search query"),
    maxResults: z.number().int().min(1).max(10).default(5),
  }),

  async execute({ query, maxResults }) {
    const errors: string[] = [];
    let hadSuccessfulSearch = false;

    // Restrict medical searches to trusted domains.
    const medicalQuery =
      `${query} ` +
      "(site:nih.gov OR site:who.int OR site:mayoclinic.org " +
      "OR site:cdc.gov OR site:fda.gov OR site:pubmed.ncbi.nlm.nih.gov)";

    // Attempt SerpAPI first.
    if (process.env.SERPAPI_KEY) {
      try {
        const params = new URLSearchParams({
          api_key: process.env.SERPAPI_KEY,
          q: medicalQuery,
          num: String(maxResults),
          engine: "google",
        });

        const response = await fetch(
          `https://serpapi.com/search.json?${params.toString()}`,
          { signal: AbortSignal.timeout(10000) }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(String(data.error));
        }

        if (!Array.isArray(data.organic_results)) {
          throw new Error("Invalid SerpAPI response format");
        }

        const results: SearchResult[] = data.organic_results
          .slice(0, maxResults)
          .filter(
            (r: any) =>
              typeof r.title === "string" &&
              typeof r.link === "string"
          )
          .map((r: any) => ({
            title: r.title,
            snippet:
              typeof r.snippet === "string" ? r.snippet : "",
            link: r.link,
          }));

        if (results.length > 0) {
          return formatResults("SerpAPI", results);
        }

        hadSuccessfulSearch = true;
        errors.push("SerpAPI returned no usable results.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        errors.push(`SerpAPI: ${message}`);
        console.error("[Web Search] SerpAPI failed:", message);
      }
    }

    // Fallback to Google Custom Search.
    if (
      process.env.GOOGLE_SEARCH_API_KEY &&
      process.env.GOOGLE_SEARCH_CX
    ) {
      try {
        const params = new URLSearchParams({
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_CX,
          q: medicalQuery,
          num: String(maxResults),
        });

        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
          { signal: AbortSignal.timeout(10000) }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(
            String(data.error.message ?? "Google API error")
          );
        }

        // Google can omit "items" when no results are found.
        if (data.items !== undefined && !Array.isArray(data.items)) {
          throw new Error("Invalid Google response format");
        }

        const results: SearchResult[] = (data.items ?? [])
          .slice(0, maxResults)
          .filter(
            (r: any) =>
              typeof r.title === "string" &&
              typeof r.link === "string"
          )
          .map((r: any) => ({
            title: r.title,
            snippet:
              typeof r.snippet === "string" ? r.snippet : "",
            link: r.link,
          }));

        if (results.length > 0) {
          return formatResults("Google Custom Search", results);
        }

        hadSuccessfulSearch = true;
        errors.push("Google Custom Search returned no usable results.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);

        errors.push(`Google Custom Search: ${message}`);
        console.error("[Web Search] Google fallback failed:", message);
      }
    }

    if (hadSuccessfulSearch) {
      return "No relevant web results found. " +
        "Try a different query or consult the knowledge base.";
    }

    if (errors.length === 0) {
      return (
        "Web search is not configured. Set SERPAPI_KEY or both " +
        "GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_CX."
      );
    }

    return (
      "Live web search failed. " +
      "Search providers attempted: " +
      errors.join(" | ") +
      ". Try the knowledge base or retry the search later."
    );
  },
});

function formatResults(
  provider: SearchProvider,
  results: SearchResult[]
): string {
  return (
    `Web search results (provider: ${provider}):\n\n` +
    results
      .map(
        (r) =>
          `**${r.title}**\n${r.snippet}\nSource: ${r.link}`
      )
      .join("\n\n---\n\n")
  );
}

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
  model: MODEL_NAME,

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
