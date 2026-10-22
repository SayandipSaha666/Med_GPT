export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  agentType?: string;
  timestamp?: string | Date;
}

export interface MedicalProfileData {
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
}

export interface AgentContext {
  userId: number;
  chatId: number;
  conversationHistory: ConversationMessage[];
  chatSummary?: string | null;
  medicalProfile?: MedicalProfileData;
}

export type AgentSource = { snippet?: string; source?: string; url?: string };

export interface AgentResult {
  content: string;
  agentType: string;
  confidence: number;
  sources?: AgentSource[];
  metadata?: Record<string, unknown>;
}

export interface StreamChunk {
  type: "token" | "complete" | "metadata" | "error" | "connected" | "end";
  content: string;
  agentName?: string;
  agentType?: string;
  isPartial?: boolean;
  metadata?: {
    latencyMs?: number;
    confidence?: number;
    sources?: AgentSource[];
    guardrailTripped?: boolean;
    emergencyLevel?: string;
    reason?: string;
    error?: string;
  };
}
