// Chat DTOs
import { Message } from "./message.dto";
import { FileResponseDto } from "./file.dto";
import type { ChatSummary } from "../generated/prisma-client";
import { z } from "zod";

/**
 * Represents a chat conversation with optional structured summary.
 * The summary is a compacted clinical memory of previous consultation state.
 */
export interface Chat {
  id: number;
  userId: number;
  title: string;
  summary?: ChatSummary | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}

export interface ChatFiles {
  chatId: number;
  files: FileResponseDto[];
}

export interface CreateChatDto {
  userId: number;
  title?: string;
}

/**
 * DTO for updating chat with summary support.
 * Used when persisting compacted conversation state.
 */
export interface UpdateChatSummaryDto {
  chatId: number;
  summary: string;
}

export interface UpdateChatDto {
  title: string;
  chatId: number;
}

export const ChatIdParamDto = z.object({
  chatId: z.coerce.number().int().positive(),
});
export type ChatIdParamDto = z.infer<typeof ChatIdParamDto>;

export const CreateChatRequestDto = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});
export type CreateChatRequestDto = z.infer<typeof CreateChatRequestDto>;

export const UpdateChatRequestDto = z.object({
  title: z.string().trim().min(1).max(120),
});
export type UpdateChatRequestDto = z.infer<typeof UpdateChatRequestDto>;