// src/agents/guardrails/emergency-escalation.guard.ts
// Emergency escalation guardrail: detects life-threatening symptoms
// and injects emergency service information into the response.

import { Agent, run } from "@openai/agents";
import { z } from "zod";
import type { AgentContext } from "../types";

const EmergencyDetectionSchema = z.object({
  isEmergency: z.boolean(),
  symptoms: z.array(z.string()),
  urgencyLevel: z.enum(["none", "monitor", "urgent", "life_threatening"]),
  recommendedAction: z.string(),
});

/**
 * Classifier that detects emergency/life-threatening symptoms
 * in user queries. Runs as an input guardrail but does NOT block —
 * instead, it flags the context so the main agent includes emergency info.
 */
const emergencyDetector = new Agent({
  name: "Emergency Symptom Detector",
  model: "gpt-4o-mini",
  instructions: `You detect emergency/life-threatening medical symptoms in user messages.

LIFE-THREATENING (urgencyLevel: "life_threatening"):
- Chest pain, especially with shortness of breath or arm pain
- Severe difficulty breathing
- Signs of stroke (facial drooping, arm weakness, speech difficulty)
- Severe bleeding that won't stop
- Loss of consciousness / unresponsiveness
- Severe allergic reaction (anaphylaxis)
- Suicidal ideation or self-harm statements
- Poisoning or drug overdose
- Severe head injury

URGENT (urgencyLevel: "urgent"):
- High fever (>103°F/39.4°C) in adults
- Severe abdominal pain
- Sudden severe headache ("worst headache of my life")
- Broken bones with deformity
- Deep cuts or wounds
- Persistent vomiting with blood

MONITOR (urgencyLevel: "monitor"):
- Mild fever
- Minor pain that's worsening
- Persistent symptoms lasting over a week

List specific symptoms detected. If no emergency, set isEmergency to false.`,
  outputType: EmergencyDetectionSchema,
});

/**
 * Emergency escalation guardrail. Does NOT block the response —
 * instead, it enriches the context so the agent can include
 * appropriate emergency information.
 *
 * For life-threatening situations, it DOES trip to ensure
 * emergency numbers are always shown.
 */
export const emergencyEscalationGuardrail = {
  name: "EmergencySymptomEscalation",
  runInParallel: true,

  async execute({
    input,
    context,
  }: {
    input: string | unknown;
    context: AgentContext;
  }) {
    try {
      const result = await run(emergencyDetector, String(input), { context });
      const output = result.finalOutput;

      if (!output || !output.isEmergency) {
        return { tripwireTriggered: false };
      }

      if (output.urgencyLevel === "life_threatening") {
        console.warn(
          `[Emergency Guardrail] LIFE-THREATENING detected: ${output.symptoms.join(", ")}`
        );

        // For life-threatening situations, we trip the guardrail
        // so the system returns an emergency-specific response
        return {
          tripwireTriggered: true,
          outputInfo: JSON.stringify({
            type: "emergency_escalation",
            urgencyLevel: output.urgencyLevel,
            symptoms: output.symptoms,
            message:
              `⚠️ EMERGENCY: Based on your symptoms (${output.symptoms.join(", ")}), ` +
              `this could be a medical emergency.\n\n` +
              `🚨 Please call emergency services IMMEDIATELY:\n` +
              `• India: 112 (Emergency) or 108 (Ambulance)\n` +
              `• US: 911\n` +
              `• UK: 999\n\n` +
              `${output.recommendedAction}\n\n` +
              `Do not wait — seek immediate medical attention.`,
          }),
        };
      }

      // For urgent but not life-threatening, don't trip — let the agent handle it
      // but log it for monitoring
      if (output.urgencyLevel === "urgent") {
        console.info(
          `[Emergency Guardrail] URGENT symptoms detected: ${output.symptoms.join(", ")}`
        );
      }

      return { tripwireTriggered: false };
    } catch (error) {
      console.error("[Emergency Guardrail] Detection error:", error);
      return { tripwireTriggered: false };
    }
  },
};
