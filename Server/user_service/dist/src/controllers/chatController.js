"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatController = exports.ChatController = void 0;
const chat_service_1 = require("../services/chat.service");
const chat_schema_1 = require("../schema/chat.schema");
class ChatController {
    async createChat(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            let title;
            if (req.body.title) {
                const validation = chat_schema_1.CreateChatSchema.safeParse({ title: req.body.title });
                if (validation.success) {
                    title = validation.data.title;
                }
            }
            const chat = await chat_service_1.chatService.createChat(userId, title);
            res.status(201).json({
                success: true,
                message: "Chat created successfully",
                data: chat,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getChats(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const chats = await chat_service_1.chatService.getChats(userId);
            res.status(200).json({
                success: true,
                message: "Chats fetched successfully",
                data: chats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getChat(req, res, next) {
        try {
            // Validate chat ID
            const validation = chat_schema_1.ChatIdSchema.safeParse({ id: req.params.id });
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    message: "Invalid chat ID",
                });
                return;
            }
            const chatId = typeof validation.data.id === "string"
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
            const chat = await chat_service_1.chatService.getChatById(chatId, userId);
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
        }
        catch (error) {
            next(error);
        }
    }
    async deleteChat(req, res, next) {
        try {
            // Validate chat ID
            const validation = chat_schema_1.ChatIdSchema.safeParse({ id: req.params.id });
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    message: "Invalid chat ID",
                });
                return;
            }
            const chatId = typeof validation.data.id === "string"
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
            await chat_service_1.chatService.deleteChat(chatId, userId);
            res.status(200).json({
                success: true,
                message: "Chat deleted successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateChatTitle(req, res, next) {
        try {
            // Validate request body and route param
            const validation = chat_schema_1.UpdateChatSchema.safeParse({
                title: req.body.title,
                chatId: req.params.id,
            });
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    message: validation.error.issues[0]?.message ?? "Validation failed",
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
            const chat = await chat_service_1.chatService.updateChatTitle(chatId, userId, title);
            res.status(200).json({
                success: true,
                message: "Chat title updated successfully",
                data: chat,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ChatController = ChatController;
exports.chatController = new ChatController();
