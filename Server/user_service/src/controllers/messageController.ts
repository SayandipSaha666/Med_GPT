import { Request, Response, NextFunction } from "express";
import { messageService } from "../services/message.service";
import { SendMessageSchema, ChatIdParamsSchema, MessageIdParamsSchema } from "../schema/message.schema";
import type { MessageResponse } from "../dto/message.dto";
import { agentClient } from "../clients/agent.client";
import { compactionService } from "../services/compaction.service";
import { prisma } from "../lib/prisma";

export class MessageController {
  async enqueueMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chatIdValidation = ChatIdParamsSchema.safeParse({ id: req.params.id });
      const bodyValidation = SendMessageSchema.safeParse(req.body);
      if (!chatIdValidation.success || !bodyValidation.success) {
        res.status(400).json({
          success: false,
          message: !chatIdValidation.success
            ? "Invalid chat ID"
            : bodyValidation.error.issues[0]?.message ?? "Validation failed",
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const chatId = Number(chatIdValidation.data.id);
      const result = await messageService.enqueueMessage(
        userId,
        chatId,
        bodyValidation.data.content,
        bodyValidation.data.fileIds,
      );

      res.status(202).json({
        success: true,
        message: "Agent task queued",
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Insufficient credits") {
        res.status(402).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  async streamAgentTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chatIdValidation = ChatIdParamsSchema.safeParse({ id: req.params.id });
      const userId = req.user?.id;
      const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
      if (!chatIdValidation.success || !userId || typeof taskId !== "string" || !/^[a-z0-9_-]+$/i.test(taskId)) {
        res.status(!userId ? 401 : 400).json({ success: false, message: "Invalid chat or task ID" });
        return;
      }

      const chatId = Number(chatIdValidation.data.id);
      const where = { id: taskId, chatId, userId };
      const initialTask = await prisma.agentTask.findFirst({ where });
      if (!initialTask) {
        res.status(404).json({ success: false, message: "Agent task not found" });
        return;
      }

      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
      res.write("retry: 1000\n\n");

      let closed = false;
      let lastContent = "";
      let lastState = "";
      let lastHeartbeatAt = Date.now();
      res.on("close", () => { closed = true; });

      while (!closed && !res.writableEnded) {
        const task = await prisma.agentTask.findFirst({ where });
        if (!task) break;
        const assistant = await prisma.message.findUnique({
          where: { id: task.assistantMessageId },
          select: { content: true, agentType: true, metadata: true },
        });
        if (!assistant) break;

        const state = String((assistant.metadata as Record<string, unknown> | null)?.generationStatus ?? task.status);
        const content = assistant.content ?? "";
        const reset = content.length < lastContent.length || !content.startsWith(lastContent);
        const delta = reset ? content : content.slice(lastContent.length);
        if (state !== lastState || delta || reset) {
          res.write(`data: ${JSON.stringify({
            type: "update",
            status: state,
            progressMessage: (assistant.metadata as Record<string, unknown> | null)?.progressMessage,
            agentType: assistant.agentType ?? task.agentType,
            content,
            delta,
            reset,
          })}\n\n`);
          lastState = state;
          lastContent = content;
        }

        if (["completed", "failed", "cancelled"].includes(task.status)) {
          res.write(`data: ${JSON.stringify({ type: "end", status: task.status })}\n\n`);
          res.end();
          break;
        }
        if (Date.now() - lastHeartbeatAt >= 15_000) {
          res.write(": keep-alive\n\n");
          lastHeartbeatAt = Date.now();
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      if (!res.writableEnded) res.end();
    } catch (error) {
      if (!res.headersSent) next(error);
      else if (!res.writableEnded) res.end();
    }
  }

  async cancelAgentTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const chatId = Number(req.params.id);
      const userId = req.user?.id;
      const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
      if (!Number.isInteger(chatId) || chatId < 1 || !userId || typeof taskId !== "string" || !/^[a-z0-9_-]+$/i.test(taskId)) {
        res.status(!userId ? 401 : 400).json({ success: false, message: "Invalid chat or task ID" });
        return;
      }

      const task = await prisma.agentTask.findFirst({
        where: { id: taskId, chatId, userId, status: { in: ["queued", "running"] } },
      });
      if (!task) {
        res.status(409).json({ success: false, message: "Task is already complete or cannot be cancelled" });
        return;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.agentTask.updateMany({
          where: { id: task.id, status: { in: ["queued", "running"] } },
          data: { status: "cancelled", leaseExpiresAt: null, completedAt: new Date() },
        });
        if (!cancelled.count) return false;
        await tx.message.update({
          where: { id: task.assistantMessageId },
          data: {
            metadata: { taskId: task.id, generationStatus: "cancelled", progressMessage: "Response generation stopped." },
          },
        });
        await tx.user.update({ where: { id: userId }, data: { credits: { increment: 1 } } });
        return true;
      });

      if (!updated) {
        res.status(409).json({ success: false, message: "Task is already complete or cannot be cancelled" });
        return;
      }
      res.status(200).json({ success: true, message: "Agent task cancelled" });
    } catch (error) {
      next(error);
    }
  }

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
          message: bodyValidation.error.issues[0]?.message ?? "Validation failed",
        });
        return;
      }

      const { content, fileIds } = bodyValidation.data;
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

      const result = await messageService.sendMessage(userId, chatId, content, fileIds);

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Streaming endpoint for real-time agent responses.
   *
   * This endpoint uses Server-Sent Events (SSE) to stream the agent's
   * response as it's being generated, enabling a chat-like experience.
   */
  async streamMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
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
          message: bodyValidation.error.issues[0]?.message ?? "Validation failed",
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

      // Set up SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

      // Send initial connection established message
      res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

      // Get conversation history for context
      const memoryContext = await compactionService.getChatMemoryContext(chatId);
      const conversationHistory = memoryContext.recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Stream agent responses
      for await (const chunk of agentClient.stream(content, {
        userId,
        chatId,
        conversationHistory,
        chatSummary: memoryContext.chatSummaryText,
      })) {
        // Send chunk as SSE message
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      // End the stream
      res.write(`data: ${JSON.stringify({ type: "end", timestamp: new Date().toISOString() })}\n\n`);
      res.end();
    } catch (error) {
      // Send error as SSE message
      res.write(`data: ${JSON.stringify({ type: "error", message: (error as Error).message })}\n\n`);
      res.end();
    }
  }

  /**
   * Deletes a user message and its corresponding assistant response.
   */
  async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paramsValidation = MessageIdParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid chat or message ID",
        });
        return;
      }

      const chatId = Number(paramsValidation.data.id);
      const messageId = Number(paramsValidation.data.messageId);
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const result = await messageService.deleteMessagePair(userId, chatId, messageId);

      res.status(200).json({
        success: true,
        message: "Messages deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Edits a user message, removes old assistant message, and resubmits to generate a new AI response.
   */
  async editMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paramsValidation = MessageIdParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({
          success: false,
          message: "Invalid chat or message ID",
        });
        return;
      }

      const bodyValidation = SendMessageSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({
          success: false,
          message: bodyValidation.error.issues[0]?.message ?? "Validation failed",
        });
        return;
      }

      const chatId = Number(paramsValidation.data.id);
      const messageId = Number(paramsValidation.data.messageId);
      const { content } = bodyValidation.data;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const result = await messageService.editAndResubmitMessage(
        userId,
        chatId,
        messageId,
        content
      );

      res.status(200).json({
        success: true,
        message: "Message updated and regenerated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const messageController = new MessageController();
