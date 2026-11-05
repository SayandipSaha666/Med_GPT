"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderBody = exports.FolderChatParams = exports.FolderIdParams = void 0;
const zod_1 = require("zod");
exports.FolderIdParams = zod_1.z.object({ folderId: zod_1.z.coerce.number().int().positive() });
exports.FolderChatParams = exports.FolderIdParams.extend({ chatId: zod_1.z.coerce.number().int().positive() });
exports.FolderBody = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(80),
    icon: zod_1.z.string().trim().max(40).optional(),
    color: zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});
