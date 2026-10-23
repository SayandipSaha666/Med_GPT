"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChatRequestDto = exports.CreateChatRequestDto = exports.ChatIdParamDto = void 0;
const zod_1 = require("zod");
exports.ChatIdParamDto = zod_1.z.object({
    chatId: zod_1.z.coerce.number().int().positive(),
});
exports.CreateChatRequestDto = zod_1.z.object({
    title: zod_1.z.string().trim().min(1).max(120).optional(),
});
exports.UpdateChatRequestDto = zod_1.z.object({
    title: zod_1.z.string().trim().min(1).max(120),
});
