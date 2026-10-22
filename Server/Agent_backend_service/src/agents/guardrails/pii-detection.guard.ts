// src/agents/guardrails/pii-detection.guard.ts
// PII detection guardrail: detects and redacts personally identifiable
// information from user inputs before they reach agent logs.

import { z } from "zod";

const PII_PATTERNS: Array<{ name: string; pattern: RegExp; replacement: string }> = [
  // Aadhaar number (India) — 12 digits, often in groups of 4
  {
    name: "aadhaar_number",
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: "[AADHAAR_REDACTED]",
  },
  // Phone numbers (Indian format)
  {
    name: "phone_india",
    pattern: /\b(?:\+91[\s-]?)?[6-9]\d{9}\b/g,
    replacement: "[PHONE_REDACTED]",
  },
  // Phone numbers (US format)
  {
    name: "phone_us",
    pattern: /\b(?:\+1[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    replacement: "[PHONE_REDACTED]",
  },
  // Email addresses
  {
    name: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    replacement: "[EMAIL_REDACTED]",
  },
  // SSN (US)
  {
    name: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: "[SSN_REDACTED]",
  },
  // Credit card numbers (basic pattern)
  {
    name: "credit_card",
    pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    replacement: "[CARD_REDACTED]",
  },
  // Insurance/policy IDs (common patterns)
  {
    name: "insurance_id",
    pattern: /\b(?:policy|insurance|member)\s*(?:#|no\.?|number|id)\s*:?\s*[A-Z0-9-]{6,20}\b/gi,
    replacement: "[INSURANCE_ID_REDACTED]",
  },
];

export interface PIIDetectionResult {
  containsPII: boolean;
  detectedTypes: string[];
  redactedText: string;
  originalText: string;
}

/**
 * Detects and redacts PII from text using regex patterns.
 * This is a fast, deterministic check that runs before any LLM processing.
 *
 * Note: This handles common PII patterns. For comprehensive PII detection
 * (names, addresses in free text), consider adding an LLM-based classifier
 * as a secondary pass.
 */
export function detectAndRedactPII(text: string): PIIDetectionResult {
  let redactedText = text;
  const detectedTypes: string[] = [];

  for (const { name, pattern, replacement } of PII_PATTERNS) {
    // Reset regex state for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      detectedTypes.push(name);
      pattern.lastIndex = 0;
      redactedText = redactedText.replace(pattern, replacement);
    }
  }

  return {
    containsPII: detectedTypes.length > 0,
    detectedTypes,
    redactedText,
    originalText: text,
  };
}

/**
 * PII detection guardrail for agent input.
 * Does NOT block the query — instead, it redacts PII from the text
 * that gets logged/stored, while still allowing the original text
 * to reach the agent (the agent needs context like "my phone is X"
 * to provide useful responses).
 */
export const piiDetectionGuardrail = {
  name: "PIIDetectionAndRedaction",
  runInParallel: true,

  async execute({ input }: { input: string | unknown }) {
    const result = detectAndRedactPII(String(input));

    if (result.containsPII) {
      console.info(
        `[PII Guard] Detected PII types: ${result.detectedTypes.join(", ")}`
      );
    }

    // Never trips — PII detection is informational.
    // The redacted text is used for logging; original reaches the agent.
    return {
      tripwireTriggered: false,
      outputInfo: result.containsPII
        ? JSON.stringify({
            containsPII: true,
            detectedTypes: result.detectedTypes,
            redactedText: result.redactedText,
          })
        : undefined,
    };
  },
};
