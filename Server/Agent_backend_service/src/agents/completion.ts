import type { Agent } from "@openai/agents";
import type { AgentContext } from "./types";

export type CompletionIssue = "empty" | "transfer_only";

/** Deliberately narrow: a referral or a substantive answer is not a failed handoff. */
export function completionIssue(output: string): CompletionIssue | undefined {
  const text = output.replace(/[*_#`]/g, "").replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
  if (!text) return "empty";
  // Evaluate continuation clauses rather than treating a conjunction as proof of an answer.
  const sentences = text.split(/[.!?;]+(?:\s+|$)|\b(?:but|however|meanwhile|in the meantime)\b/i)
    .map((part) => part.trim().replace(/^[,:\s]+|[,\s]+$/g, "")).filter(Boolean);
  const transfer = /^(?:(?:i|we)(?:['’](?:m|ve|ll)| am| have| will)?\s+(?:(?:am|are|now)\s+)?(?:transferring|routing|handing\s+off|connecting|forwarding|transfer|route|hand\s+off|connect|forward|transferred|routed|handed\s+off|connected|forwarded)\b|(?:your|the)\s+(?:request|query|question|case|consultation)\s+(?:(?:has\s+been|is\s+being|will\s+be|is|was)\s+)(?:transferred|routed|handed\s+off|forwarded|assigned)\b)/i;
  const filler = /^(?:please\s+(?:wait|hold)|(?:a|the|our)\s+specialist\s+will\s+(?:respond|review|help)|thank\s+you\s+for\s+(?:waiting|your\s+patience))\b/i;
  const promisedWork = /^(?:they|he|she|it|(?:the|our|a)\s+[\w -]*(?:specialist|analy[sz]er|agent|assistant|team))(?:'ll|\s+will)\s+(?:review|analy[sz]e|analy[sz]ing|provide|prepare|respond|help|examine|check|assess|generate)\b/i;
  return sentences.some((part) => transfer.test(part)) &&
    sentences.every((part) => transfer.test(part) || filler.test(part) || promisedWork.test(part))
    ? "transfer_only" : undefined;
}

/** Keep the specialist's tools and safety checks; change only its instructions. */
export function recoveryAgent(agent: Agent<AgentContext>): Agent<AgentContext> {
  const original = agent.instructions;
  const correction = "\n\nCOMPLETION REQUIREMENT: You are already the selected specialist. " +
    "The previous run ended without answering the current request. Review the original conversation " +
    "and use your available tools to answer it now. Do not merely announce a transfer or promise " +
    "another agent will respond. If information is missing or a tool fails, explain the limitation " +
    "and ask a specific follow-up question. Preserve all medical safety requirements.";
  return agent.clone({
    instructions: async (context, currentAgent) =>
      (typeof original === "function" ? await original(context, currentAgent) : original) + correction,
  });
}
