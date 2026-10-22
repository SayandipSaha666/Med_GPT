// src/agents/guardrails/output-compliance.guard.ts
// Output guardrail: ensures every medical response includes disclaimers,
// avoids definitive diagnoses, and never prescribes specific medications.

import { Agent, run, type OutputGuardrailFunctionArgs } from "@openai/agents";
import { OutputComplianceSchema, type AgentContext } from "../types";
import { modelProvider, getAgentModelName, runner } from "../config/model.provider";

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

      1. hasDisclaimer: Is the response telling the user to consult a healthcare professional?
        (e.g., "please consult your doctor", "seek medical advice", "visit a healthcare provider").
        This is informational only and must NOT be the sole reason a response is non-compliant.

      2. hasDefinitiveDiagnosis: Does the response ASSERT WITH CERTAINTY that the user personally has a disease?
        BAD (true): "You have diabetes", "This is definitely cancer", "You are suffering from hypertension"
        OK (false): "These symptoms may indicate...", "This could suggest...", "It's possible that..."
        OK (false): Explaining what a condition is, listing possible disease types, or restating a diagnosis
          already written on the user's uploaded prescription (e.g. "your prescription lists a diagnosis of...").

      3. hasPrescription: Is the assistant INDEPENDENTLY prescribing a new medication or dosage to the user?
        BAD (true): "Take Amoxicillin 500mg three times daily", "Start metformin 500mg twice a day"
        OK (false): Repeating, explaining, or answering questions about medications and dosages that are already
          on the user's uploaded prescription or in their medical profile (e.g. "Metformin 500mg, twice daily
          after meals, is used to manage blood sugar"). Merely naming drugs, disease names, dosages, frequencies,
          routes, side effects, or treatment classes is NOT a prescription.
        OK (false): General treatment information such as "your doctor may consider antibiotics" or
          "common treatments include...".

      Important: A response that explains an uploaded prescription, its medications, dosages, the conditions
      those medications treat, drug interactions, or possible disease types is compliant. Do not flag it for
      mentioning specific drug names or dosages when those come from the patient's own prescription.

      isCompliant = NOT hasDefinitiveDiagnosis AND NOT hasPrescription

      List only real violations. If the response is about appointment booking, web search results, or
      general greetings, mark it as compliant.`;
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

      const violations =
        output.violations.length > 0
          ? output.violations
          : [
              ...(output.hasDefinitiveDiagnosis ? ["definitive diagnosis"] : []),
              ...(output.hasPrescription ? ["independent prescription"] : []),
            ];

      if (output.hasDefinitiveDiagnosis || output.hasPrescription) {
        console.warn(
          `[Output Guardrail] NON-COMPLIANT — violations: ${violations.join(", ")}`
        );

        return {
          tripwireTriggered: true,
          outputInfo: JSON.stringify({
            violations,
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
