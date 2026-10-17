// src/agents/index.ts
// Main entry point for the MedGPT agent system.
// Provides the runAgentPipeline() function that integrates with
// the existing message service.

import { run, type RunResult } from "@openai/agents";
import { gatewayAgent } from "./gateway/gateway.agent";
import type { AgentContext, AgentResult, ConversationMessage } from "./types";

/**
 * Run the full agent pipeline for a user query.
 *
 * This is the primary integration point — called from message.service.ts
 * instead of the direct Python RAG service call.
 *
 * Flow:
 * 1. Gateway agent receives the query + context
 * 2. Input guardrails run in parallel (safety, PII, emergency)
 * 3. Gateway classifies intent and hands off to specialist
 * 4. Specialist agent generates response using RAG + profile tools
 * 5. Output guardrails validate the response (compliance check)
 * 6. Result returned to message service for storage
 *
 * @param query - The user's message
 * @param context - User ID, chat ID, conversation history, medical profile
 * @returns AgentResult with content, agent type, confidence, and sources
 */
export async function runAgentPipeline(
  query: string,
  context: AgentContext
): Promise<AgentResult> {
  const startTime = Date.now();

  try {
    // Build conversation input with history for context
    const conversationInput = buildConversationInput(
      query,
      context.conversationHistory
    );

    // Run the gateway agent — it will automatically:
    // 1. Run input guardrails
    // 2. Classify intent
    // 3. Hand off to the right specialist
    // 4. Specialist runs output guardrails
    const result: RunResult<AgentContext> = await run(
      gatewayAgent,
      conversationInput,
      { context }
    );

    const latencyMs = Date.now() - startTime;
    const lastAgentName = result.lastAgent?.name || "Unknown";

    console.log(
      `[Agent Pipeline] Completed in ${latencyMs}ms — ` +
        `routed to: ${lastAgentName}`
    );

    return {
      content: String(result.finalOutput || "I apologize, but I was unable to generate a response. Please try again."),
      agentType: lastAgentName,
      confidence: 0.85, // Default confidence; specialist agents can override
      sources: [], // TODO: Extract sources from tool calls
      metadata: {
        latencyMs,
        lastAgent: lastAgentName,
        guardrailsPassed: true,
      },
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;

    // Handle guardrail tripwires
    if (isGuardrailError(error)) {
      console.warn(
        `[Agent Pipeline] Guardrail tripped in ${latencyMs}ms:`,
        getErrorInfo(error)
      );

      const info = parseGuardrailInfo(error);

      // Emergency escalation gets special handling
      if (info?.type === "emergency_escalation") {
        return {
          content: info.message,
          agentType: "EmergencyEscalation",
          confidence: 1.0,
          metadata: {
            latencyMs,
            guardrailTripped: true,
            emergencyLevel: info.urgencyLevel,
          },
        };
      }

      // Self-harm detection
      if (info?.reason === "self_harm") {
        return {
          content:
            info.message ||
            "If you or someone you know is in crisis, please call emergency services (112/911) " +
              "or reach out to a crisis helpline immediately. You are not alone.",
          agentType: "SafetyFilter",
          confidence: 1.0,
          metadata: { latencyMs, guardrailTripped: true, reason: "self_harm" },
        };
      }

      // General safety block
      return {
        content:
          "I'm unable to process that request. I'm here to help with health-related " +
          "questions. Please ask a medical or wellness question, and remember that I " +
          "cannot provide prescriptions or definitive diagnoses.",
        agentType: "SafetyFilter",
        confidence: 1.0,
        metadata: {
          latencyMs,
          guardrailTripped: true,
          reason: info?.reason || "unknown",
        },
      };
    }

    // Unexpected errors
    console.error(`[Agent Pipeline] Error after ${latencyMs}ms:`, error);
    return {
      content:
        "I apologize, but I encountered an error processing your request. " +
        "Please try again, and if the issue persists, our team has been notified.",
      agentType: "Error",
      confidence: 0,
      metadata: {
        latencyMs,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Builds the conversation input string with recent history context.
 * The gateway agent needs history to understand follow-up questions.
 */
function buildConversationInput(
  currentQuery: string,
  history: ConversationMessage[]
): string {
  if (history.length === 0) {
    return currentQuery;
  }

  // Include last 5 messages for context (keep token usage reasonable)
  const recentHistory = history.slice(-5);
  const historyText = recentHistory
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  return `Previous conversation:\n${historyText}\n\nCurrent message: ${currentQuery}`;
}

/**
 * Type guard for guardrail errors (tripwires).
 */
function isGuardrailError(error: unknown): boolean {
  if (error && typeof error === "object") {
    // The OpenAI Agents SDK throws specific error types for guardrail trips
    const errorObj = error as Record<string, unknown>;
    return (
      errorObj.type === "guardrail_tripwire" ||
      errorObj.name === "InputGuardrailTripwireTriggered" ||
      errorObj.name === "OutputGuardrailTripwireTriggered" ||
      (typeof errorObj.message === "string" &&
        errorObj.message.includes("Guardrail"))
    );
  }
  return false;
}

/**
 * Extract error info string from guardrail error.
 */
function getErrorInfo(error: unknown): string {
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;
    return String(errorObj.message || errorObj.outputInfo || "Unknown guardrail trigger");
  }
  return "Unknown error";
}

/**
 * Parse structured info from guardrail tripwire error.
 */
function parseGuardrailInfo(
  error: unknown
): Record<string, string> | null {
  try {
    if (error && typeof error === "object") {
      const errorObj = error as Record<string, unknown>;
      const info = errorObj.outputInfo || errorObj.message;
      if (typeof info === "string") {
        // Try parsing as JSON first
        try {
          return JSON.parse(info);
        } catch {
          return { reason: info, message: info };
        }
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

// ─── Re-exports ──────────────────────────────────────────────────────────────

export { gatewayAgent } from "./gateway/gateway.agent";
export * from "./types";
export * from "./guardrails";
export {
  getDepartmentAgent,
  departmentAgentMap,
} from "./departments";
