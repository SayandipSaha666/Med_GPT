"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageController = exports.MessageController = void 0;
const message_service_1 = require("../services/message.service");
const message_schema_1 = require("../schema/message.schema");
const agent_client_1 = require("../clients/agent.client");
const compaction_service_1 = require("../services/compaction.service");
class MessageController {
    async sendMessage(req, res, next) {
        try {
            // Validate chat ID
            const chatIdValidation = message_schema_1.ChatIdParamsSchema.safeParse({ id: req.params.id });
            if (!chatIdValidation.success) {
                res.status(400).json({
                    success: false,
                    message: "Invalid chat ID",
                });
                return;
            }
            // Validate request body
            const bodyValidation = message_schema_1.SendMessageSchema.safeParse(req.body);
            if (!bodyValidation.success) {
                res.status(400).json({
                    success: false,
                    message: bodyValidation.error.issues[0]?.message ?? "Validation failed",
                });
                return;
            }
            const { content, fileIds } = bodyValidation.data;
            const chatId = typeof chatIdValidation.data.id === "string"
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
            const result = await message_service_1.messageService.sendMessage(userId, chatId, content, fileIds);
            res.status(201).json({
                success: true,
                message: "Message sent successfully",
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Streaming endpoint for real-time agent responses.
     *
     * This endpoint uses Server-Sent Events (SSE) to stream the agent's
     * response as it's being generated, enabling a chat-like experience.
     */
    async streamMessage(req, res, next) {
        try {
            // Validate chat ID
            const chatIdValidation = message_schema_1.ChatIdParamsSchema.safeParse({ id: req.params.id });
            if (!chatIdValidation.success) {
                res.status(400).json({
                    success: false,
                    message: "Invalid chat ID",
                });
                return;
            }
            // Validate request body
            const bodyValidation = message_schema_1.SendMessageSchema.safeParse(req.body);
            if (!bodyValidation.success) {
                res.status(400).json({
                    success: false,
                    message: bodyValidation.error.issues[0]?.message ?? "Validation failed",
                });
                return;
            }
            const { content } = bodyValidation.data;
            const chatId = typeof chatIdValidation.data.id === "string"
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
            const memoryContext = await compaction_service_1.compactionService.getChatMemoryContext(chatId);
            const conversationHistory = memoryContext.recentMessages.map((m) => ({
                role: m.role,
                content: m.content,
            }));
            // Stream agent responses
            for await (const chunk of agent_client_1.agentClient.stream(content, {
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
        }
        catch (error) {
            // Send error as SSE message
            res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
            res.end();
        }
    }
    /**
     * Deletes a user message and its corresponding assistant response.
     */
    async deleteMessage(req, res, next) {
        try {
            const paramsValidation = message_schema_1.MessageIdParamsSchema.safeParse(req.params);
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
            const result = await message_service_1.messageService.deleteMessagePair(userId, chatId, messageId);
            res.status(200).json({
                success: true,
                message: "Messages deleted successfully",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Edits a user message, removes old assistant message, and resubmits to generate a new AI response.
     */
    async editMessage(req, res, next) {
        try {
            const paramsValidation = message_schema_1.MessageIdParamsSchema.safeParse(req.params);
            if (!paramsValidation.success) {
                res.status(400).json({
                    success: false,
                    message: "Invalid chat or message ID",
                });
                return;
            }
            const bodyValidation = message_schema_1.SendMessageSchema.safeParse(req.body);
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
            const result = await message_service_1.messageService.editAndResubmitMessage(userId, chatId, messageId, content);
            res.status(200).json({
                success: true,
                message: "Message updated and regenerated successfully",
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MessageController = MessageController;
exports.messageController = new MessageController();
