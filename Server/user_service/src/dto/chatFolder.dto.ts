import { z } from "zod";

export const FolderIdParams = z.object({ folderId: z.coerce.number().int().positive() });
export const FolderChatParams = FolderIdParams.extend({ chatId: z.coerce.number().int().positive() });
export const FolderBody = z.object({
  name: z.string().trim().min(1).max(80),
  icon: z.string().trim().max(40).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export interface ChatFolderDto {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  chatIds: number[];
  createdAt: Date;
  updatedAt: Date;
}
