import express from "express";
import { chatFolderController } from "../controllers/chatFolder.controller";

const router = express.Router();
router.get("/", chatFolderController.list);
router.post("/", chatFolderController.create);
router.put("/:folderId", chatFolderController.update);
router.delete("/:folderId", chatFolderController.delete);
router.put("/:folderId/chats/:chatId", chatFolderController.addChat);
router.delete("/:folderId/chats/:chatId", chatFolderController.removeChat);
export default router;
