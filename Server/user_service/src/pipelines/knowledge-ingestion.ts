// src/pipelines/knowledge-ingestion.ts
// Pipeline for ingesting new knowledge into BOTH PostgreSQL and Pinecone.
// This ensures every piece of knowledge is searchable via:
//   - PostgreSQL: exact keyword match, structured filters, full-text search
//   - Pinecone: semantic similarity search (vector embeddings)
//
// This is the "dual-write" pattern that makes the agent's multi-tool
// context assembly work — agents can search either store depending on
// the query type, and get relevant results from both.

import { prisma } from "../lib/prisma";
import { createHash } from "crypto";
import { env } from "../../config/env";

const RAG_SERVICE_URL = env.RAG_SERVICE_URL || "http://localhost:8000";

interface KnowledgeInput {
  title: string;
  content: string;
  source: "WEB_SEARCH" | "UPLOADED_DOCUMENT" | "MEDICAL_GUIDELINE" | "HOSPITAL_DATA" | "AGENT_LEARNING" | "MANUAL_ENTRY";
  sourceUrl?: string;
  department?: string;
  tags?: string[];
  isVerified?: boolean;
}

interface IngestionResult {
  knowledgeEntryId: string;
  pineconeId?: string;
  isDuplicate: boolean;
  vectorized: boolean;
}

/**
 * Ingests a piece of knowledge into both PostgreSQL and Pinecone.
 *
 * This is the central function called by:
 * - Web Search Agent (when it finds useful information)
 * - Document processing pipeline (when a user uploads a medical document)
 * - Admin knowledge management (manually curated content)
 * - File exploration agent (when it extracts knowledge from files)
 *
 * The dual-write ensures:
 * - search_knowledge_base tool (PostgreSQL) finds it via keywords + filters
 * - search_medical_knowledge tool (Pinecone) finds it via semantic similarity
 */
export async function ingestKnowledge(input: KnowledgeInput): Promise<IngestionResult> {
  // 1. Generate content hash for deduplication
  const contentHash = createHash("sha256")
    .update(input.content)
    .digest("hex");

  // 2. Check for duplicate in PostgreSQL
  const existing = await prisma.knowledgeEntry.findUnique({
    where: { contentHash },
  });

  if (existing) {
    return {
      knowledgeEntryId: existing.id,
      pineconeId: existing.pineconeId || undefined,
      isDuplicate: true,
      vectorized: !!existing.pineconeId,
    };
  }

  // 3. Store in PostgreSQL (structured/keyword search)
  const entry = await prisma.knowledgeEntry.create({
    data: {
      title: input.title,
      content: input.content,
      contentHash,
      source: input.source,
      sourceUrl: input.sourceUrl,
      department: input.department,
      tags: (input.tags || []).map((t) => t.toLowerCase()),
      isVerified: input.isVerified || false,
    },
  });

  // 4. Vectorize and store in Pinecone (semantic search)
  // This calls the existing Python RAG service to generate embeddings
  // and upsert to Pinecone.
  let pineconeId: string | undefined;
  let vectorized = false;

  try {
    pineconeId = await vectorizeAndStore(entry.id, input);
    vectorized = !!pineconeId;

    // Update the entry with the Pinecone reference
    if (pineconeId) {
      await prisma.knowledgeEntry.update({
        where: { id: entry.id },
        data: {
          pineconeId,
          embeddingModel: "sentence-transformers/all-MiniLM-L6-v2",
        },
      });
    }
  } catch (error) {
    // Non-fatal: knowledge is still in PostgreSQL even if vectorization fails.
    // It'll be searchable via keyword search but not semantic search.
    console.error(
      `[Knowledge Ingestion] Vectorization failed for entry ${entry.id}:`,
      error
    );
  }

  return {
    knowledgeEntryId: entry.id,
    pineconeId,
    isDuplicate: false,
    vectorized,
  };
}

/**
 * Vectorize content and store in Pinecone via the Python RAG service.
 *
 * In Phase 1, this calls the existing Python service.
 * In Phase 4, this will be migrated to a TypeScript implementation
 * using @pinecone-database/pinecone + a local embedding model.
 */
async function vectorizeAndStore(
  entryId: string,
  input: KnowledgeInput
): Promise<string | null> {
  try {
    // Call a custom endpoint on the Python RAG service for vectorization.
    // If this endpoint doesn't exist yet, we'll add it later.
    // For now, skip vectorization silently.
    const response = await fetch(`${RAG_SERVICE_URL}/vectorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: entryId,
        text: `${input.title}\n\n${input.content}`,
        metadata: {
          source: input.source,
          department: input.department || "general",
          tags: input.tags || [],
          entryId,
        },
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      console.warn(
        `[Knowledge Ingestion] Vectorize endpoint returned ${response.status}. ` +
        `Knowledge saved to PostgreSQL only.`
      );
      return null;
    }

    const data = await response.json();
    return data.pineconeId || entryId;
  } catch (error) {
    // The /vectorize endpoint may not exist yet — this is expected in Phase 1
    console.info(
      "[Knowledge Ingestion] Vectorize endpoint not available. " +
      "Knowledge saved to PostgreSQL only (keyword search). " +
      "Add /vectorize endpoint to the Python RAG service for semantic search."
    );
    return null;
  }
}

/**
 * Batch ingest multiple knowledge entries.
 * Used for initial seeding of the knowledge base.
 */
export async function batchIngestKnowledge(
  inputs: KnowledgeInput[]
): Promise<{ total: number; ingested: number; duplicates: number; vectorized: number }> {
  let ingested = 0;
  let duplicates = 0;
  let vectorized = 0;

  for (const input of inputs) {
    const result = await ingestKnowledge(input);
    if (result.isDuplicate) {
      duplicates++;
    } else {
      ingested++;
      if (result.vectorized) vectorized++;
    }
  }

  return {
    total: inputs.length,
    ingested,
    duplicates,
    vectorized,
  };
}
