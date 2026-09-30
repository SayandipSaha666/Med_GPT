import z from "zod";

export const CreateChatSchema = z.object({
  title: z.string().optional(),
});

export const UpdateChatSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  chatId: z.number().positive("Invalid chat ID"),
});

export const ChatIdSchema = z.object({
  id: z.number().positive("Invalid chat ID"),
});

export type CreateChatDto = z.infer<typeof CreateChatSchema>;
export type UpdateChatDto = z.infer<typeof UpdateChatSchema>;
export type ChatIdDto = z.infer<typeof ChatIdSchema>;
