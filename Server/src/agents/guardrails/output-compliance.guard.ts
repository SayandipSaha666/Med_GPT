// src/agents/guardrails/output-compliance.guard.ts
// Output guardrail: ensures every medical response includes disclaimers,
// avoids definitive diagnoses, and never prescribes specific medications.

import { Agent, run, type OutputGuardrailFunctionArgs } from "@openai/agents";
import { OutputComplianceSchema, type AgentContext } from "../types";
import { modelProvider, getAgentModelName, runner } from "../../config/model.provider";

// Model name based on configured provider (OpenAI or Groq)
const COMPLIANCE_CLASSIFIER_MODEL = getAgentModelName();

/**
 * Post-generation validator that checks the agent's response
 * for medical compliance before it reaches the user.
 */
const outputComplianceClassifier = new Agent<
  AgentContext,
  typeof OutputComplianceSchema
>({
  name: "MedGPT Output Compliance Checker",
  model: COMPLIANCE_CLASSIFIER_MODEL,
  instructions: ({context}) => {
    return  `You are a compliance checker for a medical AI assistant's responses.
      Users local context can be found in ${JSON.stringify(context)}
      Review the generated response and check for these rules:

      1. hasDisclaimer: Does the response include advice to consult a healthcare professional?
        (e.g., "please consult your doctor", "seek medical advice", "visit a healthcare provider")

      2. hasDefinitiveDiagnosis: Does the response make a definitive diagnosis?
        BAD: "You have diabetes", "This is definitely cancer"
        OK: "This could suggest...", "These symptoms may indicate...", "It's possible that..."

      3. hasPrescription: Does the response prescribe specific medications with dosages?
        BAD: "Take Amoxicillin 500mg three times daily"
        OK: "Your doctor may consider antibiotics", "Common treatments include..."

      isCompliant = hasDisclaimer AND NOT hasDefinitiveDiagnosis AND NOT hasPrescription

      List any violations found. If the response is about appointment booking,
      web search results, or general greetings, mark it as compliant.`;
    },
    outputType: OutputComplianceSchema,
});

/**
 * Output guardrail configuration for the OpenAI Agents SDK.
 * Attach this to any medical agent's `outputGuardrails` array.
 */
export const outputComplianceGuardrail = {
  name: "MedicalOutputComplianceCheck",

  async execute({ agentOutput, context }: OutputGuardrailFunctionArgs<AgentContext>) {
    try {
      const result = await runner.run(
        outputComplianceClassifier,
        String(agentOutput),
        { context: context.context }
      );

      const output = result.finalOutput;

      if (!output) {
        return { tripwireTriggered: false, outputInfo: undefined };
      }

      if (!output.isCompliant) {
        console.warn(
          `[Output Guardrail] NON-COMPLIANT — violations: ${output.violations.join(", ")}`
        );

        return {
          tripwireTriggered: true,
          outputInfo: JSON.stringify({
            violations: output.violations,
            hasDefinitiveDiagnosis: output.hasDefinitiveDiagnosis,
            hasPrescription: output.hasPrescription,
            hasDisclaimer: output.hasDisclaimer,
          }),
        };
      }

      return { tripwireTriggered: false, outputInfo: undefined };
    } catch (error) {
      // Fail-open on classifier errors — better to show a response
      // without perfect compliance than to show nothing
      console.error(
        "[Output Guardrail] Classifier error, failing open:",
        error
      );
      return { tripwireTriggered: false, outputInfo: undefined };
    }
  },
};
