// Chat DTOs
import { Message } from "./message.dto";
import { FileResponseDto } from "./file.dto";
import { z } from "zod";

export interface Chat {
  id: number;
  userId: number;
  title: string;
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