import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
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

// Message routes
router.post("/:id/message", authMiddleware, messageController.sendMessage);

export default router;
