import z from "zod";

export const SendMessageSchema = z.object({
  content: z.string().min(1, "Content cannot be empty").max(5000, "Content too long"),
});

export const ChatIdParamsSchema = z.object({
  id: z.union([z.string().regex(/^\d+$/, "Invalid chat ID"), z.number()]),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;
export type ChatIdParamsDto = z.infer<typeof ChatIdParamsSchema>;
