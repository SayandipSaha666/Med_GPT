import { env } from "../../config/env";
import type {
  AgentContext,
  AgentResult,
  StreamChunk,
} from "../types/agent.types";

const AGENT_SERVICE_URL = (env.AGENT_SERVICE_URL || "http://localhost:4000").replace(/\/+$/, "");

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (env.AGENT_SERVICE_API_KEY) {
    headers["x-internal-api-key"] = env.AGENT_SERVICE_API_KEY;
  }

  return headers;
}

export class AgentServiceClient {
  async generate(query: string, context: AgentContext): Promise<AgentResult> {
    const response = await fetch(`${AGENT_SERVICE_URL}/agent/respond`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ query, context }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Agent service request failed (${response.status})${detail ? `: ${detail}` : ""}`
      );
    }

    return (await response.json()) as AgentResult;
  }

  async *stream(
    query: string,
    context: AgentContext
  ): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${AGENT_SERVICE_URL}/agent/stream`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ query, context }),
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Agent service stream failed (${response.status})${detail ? `: ${detail}` : ""}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          yield JSON.parse(trimmed) as StreamChunk;
        }
      }

      const remaining = buffer.trim();
      if (remaining) {
        yield JSON.parse(remaining) as StreamChunk;
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const agentClient = new AgentServiceClient();
