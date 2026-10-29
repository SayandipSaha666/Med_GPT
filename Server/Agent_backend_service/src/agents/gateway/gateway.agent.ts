// src/agents/gateway/gateway.agent.ts
// Gateway Agent (Router): the first point of contact for all user queries.
// Uses a cheap, fast model to classify intent and route to the appropriate
// department or specialized agent.
//
// Groq support: When MODEL_PROVIDER=groq, this uses qwen models via GroqCloud.

import { Agent } from "@openai/agents";
import { RECOMMENDED_PROMPT_PREFIX } from "@openai/agents-core/extensions";
import type { AgentContext } from "../types";
import { getAgentModelName } from "../config/model.provider";
import {
  generalAgent,
  cardiologyAgent,
  dentalAgent,
  gynecologyAgent,
  entAgent,
  dermatologyAgent,
  orthopedicAgent,
} from "../departments";
import { prescriptionAgent } from "../specialized/prescription.agent";
import { webSearchAgent } from "../specialized/web-search.agent";
import { bookingAgent } from "../specialized/booking.agent";
import {
  inputSafetyGuardrail,
  emergencyEscalationGuardrail,
  piiDetectionGuardrail,
} from "../guardrails";

// Model name based on configured provider (OpenAI or Groq)
const MODEL_NAME = getAgentModelName();

/**
 * Gateway Agent — the entry point for all user queries.
 *
 * This agent:
 * 1. Runs input guardrails (safety, PII, emergency detection) in parallel
 * 2. Classifies the user's intent using structured output
 * 3. Hands off to the appropriate specialist agent
 *
 * Uses gpt-4o-mini (OpenAI) or qwen models (Groq) for cost-efficient routing.
 */
export const gatewayAgent = new Agent<AgentContext>({
  name: "MedGPT Gateway",
  model: MODEL_NAME,

  instructions: `${RECOMMENDED_PROMPT_PREFIX} You are the MedGPT Gateway — the first point of contact for all medical queries.

YOUR ONLY JOB is to understand the user's intent and route them to the right specialist.
You do NOT answer medical questions yourself.

ROUTING RULES:

1. **General medical questions** (symptoms, wellness, prevention, lifestyle)
   → Hand off to "General Medicine Specialist"

2. **Cardiology** (heart, chest pain, blood pressure, palpitations, ECG)
   → Hand off to "Cardiology Specialist"

3. **Dental** (teeth, gums, oral pain, dental procedures)
   → Hand off to "Dental Specialist"

4. **Gynecology** (menstrual, pregnancy, reproductive health, women's health)
   → Hand off to "Gynecology Specialist"

5. **ENT** (ear, nose, throat, sinus, hearing, voice)
   → Hand off to "ENT Specialist"

6. **Dermatology** (skin, rash, acne, hair, nails)
   → Hand off to "Dermatology Specialist"

7. **Orthopedic** (bones, joints, back pain, sports injury, fracture)
   → Hand off to "Orthopedic Specialist"

8. **Prescription analysis** (user mentions uploading/analyzing a prescription, medication review)
   → Hand off to "Prescription Analyzer"

9. **Appointment booking** (user wants to book, find hospital, schedule visit)
   → Hand off to "Appointment Booking Assistant"

10. **Web search needed** (user asks about latest research, current guidelines, drug recalls)
    → Hand off to "Medical Web Search Specialist"

If the query is ambiguous, route to General Medicine.
If the query mentions multiple departments, route to the PRIMARY concern.

ALWAYS hand off — never generate a final medical response yourself.`,

  // ─── Handoffs ──────────────────────────────────────────────────────────
  // The SDK automatically presents these as handoff options to the LLM.
  // When the gateway agent decides to route, it hands off seamlessly.
  handoffs: [
    generalAgent,
    cardiologyAgent,
    dentalAgent,
    gynecologyAgent,
    entAgent,
    dermatologyAgent,
    orthopedicAgent,
    prescriptionAgent,
    webSearchAgent,
    bookingAgent,
  ],

  // ─── Input Guardrails ──────────────────────────────────────────────────
  // These run in parallel with intent classification.
  // If any trips, the entire pipeline is halted.
  inputGuardrails: [
    inputSafetyGuardrail,
    emergencyEscalationGuardrail,
    piiDetectionGuardrail,
  ],
});

/**
 * Deterministic safety net for provider/model responses that say they will
 * transfer the request but finish without invoking an SDK handoff.
 */
export function selectFallbackAgent(input: string) {
  const query = input.toLowerCase();
  if (/prescription|drug interaction|medication safety|medication review|dosage|medicine list/.test(query)) return prescriptionAgent;
  if (/appointment|book (a|an)? ?(doctor|visit)|schedule|hospital/.test(query)) return bookingAgent;
  if (/latest|current research|recent study|clinical guideline|drug recall/.test(query)) return webSearchAgent;
  if (/heart|cardiac|cardiology|chest pain|blood pressure|palpitation|ecg/.test(query)) return cardiologyAgent;
  if (/tooth|teeth|dental|gum|oral pain/.test(query)) return dentalAgent;
  if (/pregnan|menstrual|period|gynecol|reproductive health/.test(query)) return gynecologyAgent;
  if (/ear|nose|throat|sinus|hearing|voice|ent/.test(query)) return entAgent;
  if (/skin|rash|acne|hair loss|nail|dermatolog/.test(query)) return dermatologyAgent;
  if (/bone|joint|back pain|fracture|orthopedic|sports injury/.test(query)) return orthopedicAgent;
  return generalAgent;
}
