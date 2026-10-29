// src/mappers/message.mapper.ts
import type { Message as DbMessage, File as DbFile } from "../generated/prisma-client";
import type { Message } from "../dto/message.dto";
import type { Source } from "../dto/source.dto";
import type { ToolCall } from "../dto/tool-call.dto";
import { toFileAttachment } from "./file.mapper";

export function toMessage(m: DbMessage & { files: DbFile[] }): Message {
    return {
        id: m.id,
        chatId: m.chatId,
        role: m.role as Message["role"],
        content: m.content,
        timestamp: m.timestamp,
        files: m.files.map(toFileAttachment),
        sources: (m.sources as unknown as Source[]) ?? [],
        toolCalls: (m.toolCalls as unknown as ToolCall[]) ?? [],
        agentType: m.agentType,
        metadata: m.metadata as Record<string, unknown> | null,
    };
}
