// src/config/model.provider.ts
// Creates the appropriate model provider based on configuration for AGENTS only.
//
// The OpenAI SDK provider is used for:
// - Gateway agent (intent routing)
// - Department agents (cardiology, dental, etc.)
// - Guardrails (input safety, emergency, output compliance)
//
// Note: OCR uses a separate provider configuration (see extractor.provider.ts)
//
// Usage:
//   import { modelProvider, getAgentModelName } from "./config/model.provider";
//   const agent = new Agent({
//     name: "MyAgent",
//     model: getAgentModelName(),
//   });
//   const runner = new Runner({ modelProvider });

import { OpenAIProvider, Runner, setTracingDisabled } from "@openai/agents";
import { env } from "../../config/env";

// Disable OpenAI telemetry tracing if using Groq or no OpenAI key is configured
if (env.MODEL_PROVIDER === "groq" || (!env.OPENAI_AGENT_API_KEY && !env.OPENAI_API_KEY)) {
  setTracingDisabled(true);
}

/**
 * Creates and configures the appropriate model provider based on MODEL_PROVIDER env variable.
 *
 * When MODEL_PROVIDER="groq":
 * - Uses GroqCloud's OpenAI-compatible API
 * - Supports models like: qwen/qwen-2-7b, qwen/qwen-2-1.5b, meta-llama/llama-3-8b
 * - Requires GROQ_AGENT_API_KEY
 *
 * When MODEL_PROVIDER="openai" (default):
 * - Uses OpenAI's API directly
 * - Supports models like: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
 * - Requires OPENAI_AGENT_API_KEY
 */
export function createModelProvider(): OpenAIProvider {
  const providerType = env.MODEL_PROVIDER || "openai";

  if (providerType === "groq") {
    if (!env.GROQ_AGENT_API_KEY) {
      console.warn(
        "[ModelProvider] GROQ_AGENT_API_KEY not set, falling back to OpenAI"
      );
      return createOpenAIProvider();
    }

    console.log(
      `[ModelProvider] Using GroqCloud provider (agents) with model: ${env.GROQ_AGENT_MODEL}`
    );

    return new OpenAIProvider({
      apiKey: env.GROQ_AGENT_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      useResponses: false,
    });
  }

  // Default to OpenAI
  return createOpenAIProvider();
}

/**
 * Creates an OpenAI provider using the configured OpenAI API key and model.
 */
function createOpenAIProvider(): OpenAIProvider {
  const apiKey = env.OPENAI_AGENT_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[ModelProvider] No OpenAI agent API key configured. Set OPENAI_AGENT_API_KEY (or legacy OPENAI_API_KEY); agents and guardrails will fail."
    );
  }

  console.log(
    `[ModelProvider] Using OpenAI provider (agents) with model: ${env.OPENAI_AGENT_MODEL}`
  );

  return new OpenAIProvider({
    apiKey,
    useResponses: false,
  });
}

// Singleton provider instance
export const modelProvider = createModelProvider();

/**
 * Returns the appropriate model name based on the configured provider.
 * Use this when creating agents to ensure model names are provider-appropriate.
 */
export function getAgentModelName(): string {
  const providerType = env.MODEL_PROVIDER || "openai";

  if (providerType === "groq") {
    return env.GROQ_AGENT_MODEL || "qwen/qwen-2-7b";
  }

  return env.OPENAI_AGENT_MODEL || "gpt-4o";
}

export const runner = new Runner({
  modelProvider: modelProvider,
  tracingDisabled: env.MODEL_PROVIDER === "groq" || (!env.OPENAI_AGENT_API_KEY && !env.OPENAI_API_KEY),
});