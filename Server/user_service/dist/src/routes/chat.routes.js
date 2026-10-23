"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const chatController_1 = require("../controllers/chatController");
const messageController_1 = require("../controllers/messageController");
const router = express_1.default.Router();
// Auth middleware is applied at the router level in index.js
// so req.user is available in all these handlers
// Chat routes
router.post("/create", chatController_1.chatController.createChat);
router.get("/all", chatController_1.chatController.getChats);
router.get("/:id", chatController_1.chatController.getChat);
router.delete("/:id", chatController_1.chatController.deleteChat);
router.put("/update/:id", chatController_1.chatController.updateChatTitle);
// Message routes (non-streaming)
router.post("/:id/message", auth_middleware_1.authMiddleware, messageController_1.messageController.sendMessage);
router.put("/:id/message/:messageId", auth_middleware_1.authMiddleware, messageController_1.messageController.editMessage);
router.delete("/:id/message/:messageId", auth_middleware_1.authMiddleware, messageController_1.messageController.deleteMessage);
// Streaming message route (Server-Sent Events)
router.get("/:id/stream", auth_middleware_1.authMiddleware, messageController_1.messageController.streamMessage);
exports.default = router;
