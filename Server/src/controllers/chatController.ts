import { Request, Response, NextFunction } from "express";
import { chatService } from "../services/chat.service";
import { CreateChatSchema, ChatIdSchema, UpdateChatSchema } from "../schema/chat.schema";
import type { ChatWithMessages } from "../dto/chat.dto";

export class ChatController {
  async createChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      let title: string | undefined;
      if (req.body.title) {
        const validation = CreateChatSchema.safeParse({ title: req.body.title });
        if (validation.success) {
          title = validation.data.title;
        }
      }

      const chat = await chatService.createChat(userId, title);

      res.status(201).json({
        success: true,
        message: "Chat created successfully",
        data: chat,
      });
    } catch (error) {
      next(error);
    }
  }

  async getChats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const chats = await chatService.getChats(userId);

      res.status(200).json({
        success: true,
        message: "Chats fetched successfully",
        data: chats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate chat ID
      const validation = ChatIdSchema.safeParse({ id: req.params.id });
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid chat ID",
        });
        return;
      }

      const chatId =
        typeof validation.data.id === "string"
          ? parseInt(validation.data.id)
          : validation.data.id;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const chat = await chatService.getChatById(chatId, userId);

      if (!chat) {
        res.status(404).json({
          success: false,
          message: "Chat not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Chat fetched successfully",
        data: chat,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate chat ID
      const validation = ChatIdSchema.safeParse({ id: req.params.id });
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid chat ID",
        });
        return;
      }

      const chatId =
        typeof validation.data.id === "string"
          ? parseInt(validation.data.id)
          : validation.data.id;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      await chatService.deleteChat(chatId, userId);

      res.status(200).json({
        success: true,
        message: "Chat deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateChatTitle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body and route param
      const validation = UpdateChatSchema.safeParse({
        title: req.body.title,
        chatId: req.params.id,
      });
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0].message,
        });
        return;
      }
      const { title, chatId } = validation.data;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const chat = await chatService.updateChatTitle(chatId, userId, title);

      res.status(200).json({
        success: true,
        message: "Chat title updated successfully",
        data: chat,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
