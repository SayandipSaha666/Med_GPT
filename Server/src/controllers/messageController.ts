import { Request, Response, NextFunction } from "express";
import { messageService } from "../services/message.service";
import { SendMessageSchema, ChatIdParamsSchema } from "../schema/message.schema";
import type { MessageResponse } from "../dto/message.dto";

export class MessageController {
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate chat ID
      const chatIdValidation = ChatIdParamsSchema.safeParse({ id: req.params.id });
      if (!chatIdValidation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid chat ID",
        });
        return;
      }

      // Validate request body
      const bodyValidation = SendMessageSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          success: false,
          message: bodyValidation.error.errors[0].message,
        });
        return;
      }

      const { content } = bodyValidation.data;
      const chatId =
        typeof chatIdValidation.data.id === "string"
          ? parseInt(chatIdValidation.data.id)
          : chatIdValidation.data.id;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const result = await messageService.sendMessage(userId, chatId, content);

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
