import { z } from "zod";

export const PinChatParams = z.object({ chatId: z.coerce.number().int().positive() });
export type PinChatParams = z.infer<typeof PinChatParams>;

export interface ChatPinDto {
  chatId: number;
  pinnedAt: Date;
}
