import express from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { chatController } from "../controllers/chatController";
import { messageController } from "../controllers/messageController";

const router = express.Router();

// Auth middleware is applied at the router level in index.js
// so req.user is available in all these handlers

// Chat routes
router.post("/create", chatController.createChat);
router.get("/all", chatController.getChats);
router.get("/:id", chatController.getChat);
router.delete("/:id", chatController.deleteChat);
router.put("/update/:id", chatController.updateChatTitle);

// Message routes (non-streaming)
router.post("/:id/tasks", authMiddleware, messageController.enqueueMessage);
router.get("/:id/tasks/:taskId/stream", authMiddleware, messageController.streamAgentTask);
router.post("/:id/tasks/:taskId/cancel", authMiddleware, messageController.cancelAgentTask);
router.post("/:id/message", authMiddleware, messageController.sendMessage);
router.put("/:id/message/:messageId", authMiddleware, messageController.editMessage);
router.delete("/:id/message/:messageId", authMiddleware, messageController.deleteMessage);

// Streaming message route (Server-Sent Events)
router.get("/:id/stream", authMiddleware, messageController.streamMessage);

export default router;
