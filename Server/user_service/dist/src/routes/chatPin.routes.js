"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatPin_controller_1 = require("../controllers/chatPin.controller");
const router = express_1.default.Router();
router.get("/", chatPin_controller_1.chatPinController.list);
router.put("/:chatId", chatPin_controller_1.chatPinController.pin);
router.delete("/:chatId", chatPin_controller_1.chatPinController.unpin);
exports.default = router;
