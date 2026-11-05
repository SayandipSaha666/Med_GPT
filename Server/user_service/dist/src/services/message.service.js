"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = exports.MessageService = void 0;
const message_repository_1 = require("../repositories/message.repository");
const chat_repository_1 = require("../repositories/chat.repository");
const user_repository_1 = require("../repositories/user.repository");
const chat_summary_repository_1 = require("../repositories/chat-summary.repository");
const compaction_service_1 = require("./compaction.service");
const env_1 = require("../../config/env");
const agent_client_1 = require("../clients/agent.client");
const prisma_1 = require("../lib/prisma");
const RAG_SERVICE_URL = env_1.env.RAG_SERVICE_URL || "http://localhost:8000";
class MessageService {
    /**
     * Persist a user turn and assistant placeholder, then let the RabbitMQ
     * publisher dispatch the durable task in the background.
     */
    async enqueueMessage(userId, chatId, content, fileIds = []) {
        const chat = await chat_repository_1.chatRepository.findById(chatId);
        if (!chat || chat.userId !== userId)
            throw new Error("Chat not found");
        const memoryContext = await compaction_service_1.compactionService.getChatMemoryContext(chatId);
        const context = {
            userId,
            chatId,
            conversationHistory: memoryContext.recentMessages,
            chatSummary: memoryContext.chatSummaryText,
        };
        let taskId = "";
        let userMessageId = 0;
        let assistantMessageId = 0;
        await prisma_1.prisma.$transaction(async (tx) => {
            const debit = await tx.user.updateMany({
                where: { id: userId, credits: { gte: 1 } },
                data: { credits: { decrement: 1 } },
            });
            if (debit.count === 0)
                throw new Error("Insufficient credits");
            const userMessage = await tx.message.create({
                data: { chatId, role: "user", content },
            });
            userMessageId = userMessage.id;
            const attached = await tx.file.updateMany({
                where: {
                    id: { in: fileIds },
                    userId,
                },
                data: {
                    messageId: userMessage.id,
                },
            });
            if (attached.count !== fileIds.length) {
                throw new Error("One or more files are invalid");
            }
            const assistantMessage = await tx.message.create({
                data: {
                    chatId,
                    role: "assistant",
                    content: "",
                    metadata: { generationStatus: "queued", progressMessage: "Waiting for an available agent…" },
                },
            });
            assistantMessageId = assistantMessage.id;
            const task = await tx.agentTask.create({
                data: {
                    chatId,
                    userId,
                    userMessageId: userMessage.id,
                    assistantMessageId: assistantMessage.id,
                    input: content,
                    context: JSON.parse(JSON.stringify(context)),
                },
            });
            taskId = task.id;
            await tx.message.update({
                where: { id: assistantMessage.id },
                data: { metadata: { taskId, generationStatus: "queued", progressMessage: "Waiting for an available agent…" } },
            });
        });
        const [userMessage, assistantMessage] = await Promise.all([
            message_repository_1.messageRepository.findById(userMessageId),
            message_repository_1.messageRepository.findById(assistantMessageId),
        ]);
        if (!userMessage || !assistantMessage)
            throw new Error("Unable to load queued messages");
        return { userMessage, assistantMessage, taskId };
    }
    /**
     * Sends a message and generates an AI response using the multi-agent pipeline.
     * Automatically triggers compaction when the conversation reaches threshold.
     * Feeds structured summary + recent messages to provide full context to agents.
     */
    async sendMessage(userId, chatId, content, fileIds) {
        // Verify chat exists and belongs to user
        const chat = await chat_repository_1.chatRepository.findById(chatId);
        if (!chat || chat.userId !== userId) {
            throw new Error("Chat not found");
        }
        // Check user credits
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        if (Number(user.credits) < 1) {
            throw new Error("Insufficient credits");
        }
        // Save user message
        let userMessage = await message_repository_1.messageRepository.create({
            chatId,
            role: "user",
            content,
        });
        if (fileIds && fileIds.length > 0) {
            await prisma_1.prisma.file.updateMany({
                where: { id: { in: fileIds }, userId },
                data: { messageId: userMessage.id },
            });
            const reloaded = await message_repository_1.messageRepository.findById(userMessage.id);
            if (reloaded)
                userMessage = reloaded;
        }
        // Get compacted memory context for this chat:
        // - If compaction exists: returns compacted summary + last 4 messages
        // - If no compaction: returns last 6 messages (fallback)
        const memoryContext = await compaction_service_1.compactionService.getChatMemoryContext(chatId);
        // Generate AI response with full conversation context
        let assistantContent = "Sorry, I couldn't generate a response. Please try again.";
        let sources = [];
        let agentType = "unknown";
        let confidence = 0;
        try {
            // Build conversation history from memory context
            const conversationHistory = memoryContext.recentMessages.map((m) => ({
                role: m.role,
                content: m.content,
            }));
            // Run the agent pipeline with:
            // - conversationHistory: recent messages (either last 4 with summary or last 6 fallback)
            // - chatSummary: the compacted clinical memory text (if available)
            const agentResult = await agent_client_1.agentClient.generate(content, {
                userId,
                chatId,
                conversationHistory,
                chatSummary: memoryContext.chatSummaryText,
            });
            assistantContent = agentResult.content;
            sources = agentResult.sources || [];
            agentType = agentResult.agentType || "unknown";
            confidence = agentResult.confidence || 0;
            // Deduct credits
            await user_repository_1.userRepository.incrementCredits(userId, -1);
        }
        catch (error) {
            console.error("Agent pipeline error:", error);
            // Continue with fallback message - user message is already saved
        }
        // Save assistant message with agent metadata
        const assistantMessage = await message_repository_1.messageRepository.create({
            chatId,
            role: "assistant",
            content: assistantContent,
        });
        // Update message with agent type and confidence
        await message_repository_1.messageRepository.updateAgentMetadata(assistantMessage.id, {
            agentType,
            confidence,
        });
        // Auto-compact conversation if threshold reached
        // This runs in background and doesn't block the response
        compaction_service_1.compactionService.autoCompactIfNeeded(chatId, userId).catch((err) => {
            console.error("[AutoCompaction] Error:", err);
        });
        return { userMessage, assistantMessage, sources };
    }
    /**
     * Gets chat history with compacted summary support.
     * Returns either:
     * - Structured summary + recent messages (if compaction exists)
     * - Last N raw messages (fallback)
     */
    async getChatHistoryWithSummary(chatId, options) {
        const summary = await chat_summary_repository_1.chatSummaryRepository.findByChatId(chatId);
        if (summary) {
            // Fetch recent messages after compaction point
            const recentMessages = await message_repository_1.messageRepository.findManyByChatId(chatId);
            const limit = options?.limit ?? 4;
            const recent = recentMessages.slice(-limit);
            return {
                summary: summary.compactedText,
                messages: recent,
                hasCompactedSummary: true,
            };
        }
        // Fallback: no compaction, return recent messages
        const messages = await message_repository_1.messageRepository.findManyByChatId(chatId);
        const limit = options?.limit ?? 6;
        const recent = messages.slice(-limit);
        return {
            summary: null,
            messages: recent,
            hasCompactedSummary: false,
        };
    }
    /**
     * Deletes a specific user message and its corresponding assistant response.
     */
    async deleteMessagePair(userId, chatId, messageId) {
        const chat = await chat_repository_1.chatRepository.findById(chatId);
        if (!chat || chat.userId !== userId) {
            throw new Error("Chat not found");
        }
        const message = await message_repository_1.messageRepository.findById(messageId);
        if (!message || message.chatId !== chatId) {
            throw new Error("Message not found");
        }
        const idsToDelete = [messageId];
        // If it's a user message, find the subsequent assistant message
        if (message.role === "user") {
            const nextAssistant = await message_repository_1.messageRepository.findNextAssistantMessage(chatId, messageId);
            if (nextAssistant) {
                idsToDelete.push(nextAssistant.id);
            }
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            const task = await tx.agentTask.findFirst({
                where: { userMessageId: messageId, userId, chatId, status: { in: ["queued", "running"] } },
                select: { id: true },
            });
            if (task) {
                await tx.agentTask.updateMany({
                    where: { id: task.id, status: { in: ["queued", "running"] } },
                    data: { status: "cancelled", leaseExpiresAt: null, completedAt: new Date() },
                });
            }
            await tx.message.deleteMany({ where: { id: { in: idsToDelete } } });
        });
        return { deletedIds: idsToDelete };
    }
    /**
     * Edits a user message, removes old assistant response, and regenerates a fresh AI response.
     */
    async editAndResubmitMessage(userId, chatId, messageId, content) {
        const chat = await chat_repository_1.chatRepository.findById(chatId);
        if (!chat || chat.userId !== userId) {
            throw new Error("Chat not found");
        }
        const message = await message_repository_1.messageRepository.findById(messageId);
        if (!message || message.chatId !== chatId) {
            throw new Error("Message not found");
        }
        // Update user message content
        const updatedUserMessage = await message_repository_1.messageRepository.updateContent(messageId, content);
        // Delete subsequent assistant message if present
        const nextAssistant = await message_repository_1.messageRepository.findNextAssistantMessage(chatId, messageId);
        if (nextAssistant) {
            await message_repository_1.messageRepository.deleteById(nextAssistant.id);
        }
        // Generate new assistant response using updated conversation context
        const memoryContext = await compaction_service_1.compactionService.getChatMemoryContext(chatId);
        const conversationHistory = memoryContext.recentMessages.map((m) => ({
            role: m.role,
            content: m.content,
        }));
        let assistantContent = "Sorry, I couldn't generate a response. Please try again.";
        let agentType = "unknown";
        let confidence = 0;
        try {
            const agentResult = await agent_client_1.agentClient.generate(content, {
                userId,
                chatId,
                conversationHistory,
                chatSummary: memoryContext.chatSummaryText,
            });
            assistantContent = agentResult.content;
            agentType = agentResult.agentType || "unknown";
            confidence = agentResult.confidence || 0;
        }
        catch (error) {
            console.error("Agent pipeline error during edit resubmit:", error);
        }
        const assistantMessage = await message_repository_1.messageRepository.create({
            chatId,
            role: "assistant",
            content: assistantContent,
        });
        await message_repository_1.messageRepository.updateAgentMetadata(assistantMessage.id, {
            agentType,
            confidence,
        });
        return { userMessage: updatedUserMessage, assistantMessage };
    }
}
exports.MessageService = MessageService;
exports.messageService = new MessageService();
