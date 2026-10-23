"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatIdSchema = exports.UpdateChatSchema = exports.CreateChatSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.CreateChatSchema = zod_1.default.object({
    title: zod_1.default.string().optional(),
});
exports.UpdateChatSchema = zod_1.default.object({
    title: zod_1.default.string().min(1, "Title cannot be empty"),
    chatId: zod_1.default.coerce.number().positive("Invalid chat ID"),
});
exports.ChatIdSchema = zod_1.default.object({
    id: zod_1.default.coerce.number().positive("Invalid chat ID"),
});
