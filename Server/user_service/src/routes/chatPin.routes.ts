import express from "express";
import { chatPinController } from "../controllers/chatPin.controller";

const router = express.Router();
router.get("/", chatPinController.list);
router.put("/:chatId", chatPinController.pin);
router.delete("/:chatId", chatPinController.unpin);
export default router;
