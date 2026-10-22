// src/agents/index.ts
// Main entry point for the MedGPT agent system.
// Provides the runAgentPipeline() and streamAgentPipeline() functions that integrate with
// the existing message service.

import { gatewayAgent } from "./gateway/gateway.agent";
import type { AgentContext, AgentResult, ConversationMessage, StreamChunk } from "./types";
import { runner } from "./config/model.provider";

/**
 * Non-streaming agent pipeline - returns full response after completion.
 * Used for backward compatibility and when streaming is not needed.
 */
export async function runAgentPipeline(
  query: string,
  context: AgentContext
): Promise<AgentResult> {
  const startTime = Date.now();

  try {
    const conversationInput = buildConversationInput(
      query,
      context.conversationHistory,
      context.chatSummary
    );

    const result = await runner.run(gatewayAgent, conversationInput, { context });

    const latencyMs = Date.now() - startTime;
    const lastAgentName = result.lastAgent?.name || "Unknown";

    return {
      content: String(result.finalOutput || "I apologize, but I was unable to generate a response. Please try again."),
      agentType: lastAgentName,
      confidence: 0.85,
      sources: [],
      metadata: {
        latencyMs,
        lastAgent: lastAgentName,
        guardrailsPassed: true,
      },
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;

    if (isGuardrailError(error)) {
      const info = parseGuardrailInfo(error);

      if (info?.type === "emergency_escalation") {
        return {
          content: info.message,
          agentType: "EmergencyEscalation",
          confidence: 1.0,
          metadata: { latencyMs, guardrailTripped: true, emergencyLevel: info.urgencyLevel },
        };
      }

      if (info?.reason === "self_harm") {
        return {
          content: info.message ||
            "If you or someone you know is in crisis, please call emergency services (112/911) or reach out to a crisis helpline immediately. You are not alone.",
          agentType: "SafetyFilter",
          confidence: 1.0,
          metadata: { latencyMs, guardrailTripped: true, reason: "self_harm" },
        };
      }

      return {
        content: "I'm unable to process that request. I'm here to help with health-related questions. Please ask a medical or wellness question.",
        agentType: "SafetyFilter",
        confidence: 1.0,
        metadata: { latencyMs, guardrailTripped: true, reason: info?.reason || "unknown" },
      };
    }

    console.error(`[Agent Pipeline] Error after ${latencyMs}ms:`, error);
    return {
      content: "I apologize, but I encountered an error processing your request. Please try again.",
      agentType: "Error",
      confidence: 0,
      metadata: { latencyMs, error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

/**
 * Streaming generator that yields response chunks as they arrive from agents.
 *
 * This enables real-time display of AI responses in the frontend with proper markdown rendering.
 * The stream includes:
 * - "token" chunks: partial text as it's being generated
 * - "complete" chunk: final full response
 * - "metadata" chunk: agent type, confidence, latency
 */
export async function* streamAgentPipeline(
  query: string,
  context: AgentContext
): AsyncGenerator<StreamChunk> {
  const startTime = Date.now();

  try {
    const conversationInput = buildConversationInput(
      query,
      context.conversationHistory,
      context.chatSummary
    );

    // Run agent with streaming enabled
    const result = await runner.run(gatewayAgent, conversationInput, { context, stream: true });
    const stream = result.toTextStream();

    let fullResponse = "";
    let lastAgentName = result.lastAgent?.name || "Unknown";

    // Yield streaming chunks
    for await (const chunk of stream) {
      fullResponse += chunk;
      yield {
        type: "token",
        content: chunk,
        agentName: lastAgentName,
        agentType: lastAgentName,
        isPartial: true,
      };
    }

    const latencyMs = Date.now() - startTime;

    // Final metadata chunk
    yield {
      type: "metadata",
      content: "",
      agentName: lastAgentName,
      agentType: lastAgentName,
      metadata: {
        latencyMs,
        confidence: 0.85,
      },
    };

    // Complete chunk with full response
    yield {
      type: "complete",
      content: fullResponse,
      agentName: lastAgentName,
      agentType: lastAgentName,
      isPartial: false,
    };

  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;

    if (isGuardrailError(error)) {
      const info = parseGuardrailInfo(error);

      if (info?.type === "emergency_escalation") {
        yield {
          type: "complete",
          content: info.message,
          agentType: "EmergencyEscalation",
          metadata: { latencyMs, guardrailTripped: true, emergencyLevel: info.urgencyLevel },
        };
        return;
      }

      if (info?.reason === "self_harm") {
        yield {
          type: "complete",
          content: info.message ||
            "If you or someone you know is in crisis, please call emergency services (112/911) or reach out to a crisis helpline immediately. You are not alone.",
          agentType: "SafetyFilter",
          metadata: { latencyMs, guardrailTripped: true, reason: "self_harm" },
        };
        return;
      }

      yield {
        type: "complete",
        content: "I'm unable to process that request. I'm here to help with health-related questions.",
        agentType: "SafetyFilter",
        metadata: { latencyMs, guardrailTripped: true, reason: info?.reason || "unknown" },
      };
      return;
    }

    yield {
      type: "complete",
      content: "I apologize, but I encountered an error processing your request. Please try again.",
      agentType: "Error",
      metadata: { latencyMs, error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Builds the conversation input string with recent history and compacted summary context.
 */
function buildConversationInput(
  currentQuery: string,
  history: ConversationMessage[],
  chatSummary?: string | null
): string {
  const parts: string[] = [];

  if (chatSummary && chatSummary.trim().length > 0) {
    parts.push(`[PREVIOUS CONSULTATION STATE & COMPACTED SUMMARY]:\n${chatSummary.trim()}`);
  }

  if (history.length > 0) {
    const recentHistory = history.slice(-5);
    const historyText = recentHistory.map((msg) => `${msg.role}: ${msg.content}`).join("\n");
    parts.push(`[RECENT MESSAGES]:\n${historyText}`);
  }

  parts.push(`Current message: ${currentQuery}`);

  return parts.join("\n\n");
}

/**
 * Type guard for guardrail errors (tripwires).
 */
function isGuardrailError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;
    return (
      errorObj.type === "guardrail_tripwire" ||
      errorObj.name === "InputGuardrailTripwireTriggered" ||
      errorObj.name === "OutputGuardrailTripwireTriggered" ||
      (typeof errorObj.message === "string" && errorObj.message.includes("Guardrail"))
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
export { getDepartmentAgent, departmentAgentMap } from "./departments";
