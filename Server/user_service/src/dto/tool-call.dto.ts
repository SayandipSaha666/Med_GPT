// src/dto/tool-call.dto.ts
export type ToolName = "web_search" | "file_search"; // extend: "calculator" | "drug_lookup" | ...

export type ToolCallStatus = "running" | "completed" | "failed";

export interface ToolCall {
    id: string;                              // provider call id, e.g. "call_abc123"
    name: ToolName;
    status: ToolCallStatus;
    input: Record<string, unknown>;          // e.g. { query: "metformin dosage" }
    /** Short human summary for the UI ("Searched the web for …") */
    summary?: string;
    /** Indexes of sources this call produced */
    sourceIndexes: number[];
    durationMs?: number;
    error?: string;
}