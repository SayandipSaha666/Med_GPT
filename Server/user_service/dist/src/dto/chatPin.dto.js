"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinChatParams = void 0;
const zod_1 = require("zod");
exports.PinChatParams = zod_1.z.object({ chatId: zod_1.z.coerce.number().int().positive() });
