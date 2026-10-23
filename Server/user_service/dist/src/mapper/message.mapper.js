"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMessage = toMessage;
const file_mapper_1 = require("./file.mapper");
function toMessage(m) {
    return {
        id: m.id,
        chatId: m.chatId,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        files: m.files.map(file_mapper_1.toFileAttachment),
        sources: m.sources ?? [],
        toolCalls: m.toolCalls ?? [],
    };
}
