// src/agents/guardrails/index.ts
// Barrel export for all guardrails

export { inputSafetyGuardrail } from "./input-safety.guard";
export { outputComplianceGuardrail } from "./output-compliance.guard";
export { emergencyEscalationGuardrail } from "./emergency-escalation.guard";
export {
  piiDetectionGuardrail,
  detectAndRedactPII,
  type PIIDetectionResult,
} from "./pii-detection.guard";
