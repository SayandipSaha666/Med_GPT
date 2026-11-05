"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatFolder_controller_1 = require("../controllers/chatFolder.controller");
const router = express_1.default.Router();
router.get("/", chatFolder_controller_1.chatFolderController.list);
router.post("/", chatFolder_controller_1.chatFolderController.create);
router.put("/:folderId", chatFolder_controller_1.chatFolderController.update);
router.delete("/:folderId", chatFolder_controller_1.chatFolderController.delete);
router.put("/:folderId/chats/:chatId", chatFolder_controller_1.chatFolderController.addChat);
router.delete("/:folderId/chats/:chatId", chatFolder_controller_1.chatFolderController.removeChat);
exports.default = router;
