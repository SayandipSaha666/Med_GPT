import z from "zod";

export const CreateOrderSchema = z.object({
  planId: z.number().positive("Invalid plan ID"),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
