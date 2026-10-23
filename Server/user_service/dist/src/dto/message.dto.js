"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageRequestDto = void 0;
const zod_1 = require("zod");
// Request body validation for POST /api/chats/:chatId/messages
exports.SendMessageRequestDto = zod_1.z.object({
    content: zod_1.z.string().trim().min(1).max(8000),
    fileIds: zod_1.z.array(zod_1.z.string()).default([]),
    webSearch: zod_1.z.enum(["auto", "on", "off"]).default("auto"),
});
