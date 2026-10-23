"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageIdParamsSchema = exports.ChatIdParamsSchema = exports.SendMessageSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.SendMessageSchema = zod_1.default.object({
    content: zod_1.default.string().min(1, "Content cannot be empty").max(5000, "Content too long"),
    fileIds: zod_1.default.array(zod_1.default.string()).optional(),
});
exports.ChatIdParamsSchema = zod_1.default.object({
    id: zod_1.default.union([zod_1.default.string().regex(/^\d+$/, "Invalid chat ID"), zod_1.default.number()]),
});
exports.MessageIdParamsSchema = zod_1.default.object({
    id: zod_1.default.union([zod_1.default.string().regex(/^\d+$/, "Invalid chat ID"), zod_1.default.number()]),
    messageId: zod_1.default.union([zod_1.default.string().regex(/^\d+$/, "Invalid message ID"), zod_1.default.number()]),
});
