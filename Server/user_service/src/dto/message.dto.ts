import { FileResponseDto } from "./file.dto";
import type { Source } from "./source.dto";
import type { ToolCall } from "./tool-call.dto";
import { z } from "zod"
// Message DTOs
export interface Message {
  id: number;
  chatId: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  files: FileResponseDto[];
  sources?: Source[];
  toolCalls?: ToolCall[];
  agentType?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreateMessageDto {
  chatId: number;
  role: "user" | "assistant";
  content: string;
  fileIds?: string[];
  sources?: Source[];
  toolCalls?: ToolCall[];
}

export interface MessageResponse {
  userMessage: Message;
  assistantMessage: Message;
  sources?: Source[];
  toolCalls?: ToolCall[];
}

// Request body validation for POST /api/chats/:chatId/messages
export const SendMessageRequestDto = z.object({
  content: z.string().trim().min(1).max(8000),
  fileIds: z.array(z.string()).default([]),
  webSearch: z.enum(["auto", "on", "off"]).default("auto"),
});
export type SendMessageRequestDto = z.infer<typeof SendMessageRequestDto>;
