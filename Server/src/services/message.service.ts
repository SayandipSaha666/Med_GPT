import { messageRepository } from "../repositories/message.repository";
import { chatRepository } from "../repositories/chat.repository";
import { userRepository } from "../repositories/user.repository";
import { chatSummaryRepository } from "../repositories/chat-summary.repository";
import { compactionService } from "./compaction.service";
import type { Message } from "../dto/message.dto";
import { env } from "../../config/env";
import { runAgentPipeline } from "../agents";
import type { AgentSource } from "../agents/types";
import { prisma } from "../lib/prisma";

const RAG_SERVICE_URL = env.RAG_SERVICE_URL || "http://localhost:8000";

export class MessageService {
  /**
   * Sends a message and generates an AI response using the multi-agent pipeline.
   * Automatically triggers compaction when the conversation reaches threshold.
   * Feeds structured summary + recent messages to provide full context to agents.
   */
  async sendMessage(
    userId: number,
    chatId: number,
    content: string,
    fileIds?: string[]
  ): Promise<{ userMessage: Message; assistantMessage: Message; sources: AgentSource[] }> {
    // Verify chat exists and belongs to user
    const chat = await chatRepository.findById(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found");
    }

    // Check user credits
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    if (Number(user.credits) < 1) {
      throw new Error("Insufficient credits");
    }

    // Save user message
    let userMessage = await messageRepository.create({
      chatId,
      role: "user",
      content,
    });

    if (fileIds && fileIds.length > 0) {
      await prisma.file.updateMany({
        where: { id: { in: fileIds }, userId },
        data: { messageId: userMessage.id },
      });
      const reloaded = await messageRepository.findById(userMessage.id);
      if (reloaded) userMessage = reloaded;
    }

    // Get compacted memory context for this chat:
    // - If compaction exists: returns compacted summary + last 4 messages
    // - If no compaction: returns last 6 messages (fallback)
    const memoryContext = await compactionService.getChatMemoryContext(chatId);

    // Generate AI response with full conversation context
    let assistantContent = "Sorry, I couldn't generate a response. Please try again.";
    let sources: AgentSource[] = [];
    let agentType = "unknown";
    let confidence = 0;

    try {
      // Build conversation history from memory context
      const conversationHistory = memoryContext.recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Run the agent pipeline with:
      // - conversationHistory: recent messages (either last 4 with summary or last 6 fallback)
      // - chatSummary: the compacted clinical memory text (if available)
      const agentResult = await runAgentPipeline(content, {
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
      await userRepository.incrementCredits(userId, -1);
    } catch (error) {
      console.error("Agent pipeline error:", error);
      // Continue with fallback message - user message is already saved
    }

    // Save assistant message with agent metadata
    const assistantMessage = await messageRepository.create({
      chatId,
      role: "assistant",
      content: assistantContent,
    });

    // Update message with agent type and confidence
    await messageRepository.updateAgentMetadata(assistantMessage.id, {
      agentType,
      confidence,
    });

    // Auto-compact conversation if threshold reached
    // This runs in background and doesn't block the response
    compactionService.autoCompactIfNeeded(chatId, userId).catch((err) => {
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
  async getChatHistoryWithSummary(
    chatId: number,
    options?: { limit?: number }
  ): Promise<{
    summary: string | null;
    messages: Message[];
    hasCompactedSummary: boolean;
  }> {
    const summary = await chatSummaryRepository.findByChatId(chatId);

    if (summary) {
      // Fetch recent messages after compaction point
      const recentMessages = await messageRepository.findManyByChatId(chatId);
      const limit = options?.limit ?? 4;
      const recent = recentMessages.slice(-limit);

      return {
        summary: summary.compactedText,
        messages: recent,
        hasCompactedSummary: true,
      };
    }

    // Fallback: no compaction, return recent messages
    const messages = await messageRepository.findManyByChatId(chatId);
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
  async deleteMessagePair(
    userId: number,
    chatId: number,
    messageId: number
  ): Promise<{ deletedIds: number[] }> {
    const chat = await chatRepository.findById(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found");
    }

    const message = await messageRepository.findById(messageId);
    if (!message || message.chatId !== chatId) {
      throw new Error("Message not found");
    }

    const idsToDelete: number[] = [messageId];

    // If it's a user message, find the subsequent assistant message
    if (message.role === "user") {
      const nextAssistant = await messageRepository.findNextAssistantMessage(chatId, messageId);
      if (nextAssistant) {
        idsToDelete.push(nextAssistant.id);
      }
    }

    await messageRepository.deleteManyByIds(idsToDelete);
    return { deletedIds: idsToDelete };
  }

  /**
   * Edits a user message, removes old assistant response, and regenerates a fresh AI response.
   */
  async editAndResubmitMessage(
    userId: number,
    chatId: number,
    messageId: number,
    content: string
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    const chat = await chatRepository.findById(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found");
    }

    const message = await messageRepository.findById(messageId);
    if (!message || message.chatId !== chatId) {
      throw new Error("Message not found");
    }

    // Update user message content
    const updatedUserMessage = await messageRepository.updateContent(messageId, content);

    // Delete subsequent assistant message if present
    const nextAssistant = await messageRepository.findNextAssistantMessage(chatId, messageId);
    if (nextAssistant) {
      await messageRepository.deleteById(nextAssistant.id);
    }

    // Generate new assistant response using updated conversation context
    const memoryContext = await compactionService.getChatMemoryContext(chatId);
    const conversationHistory = memoryContext.recentMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    let assistantContent = "Sorry, I couldn't generate a response. Please try again.";
    let agentType = "unknown";
    let confidence = 0;

    try {
      const agentResult = await runAgentPipeline(content, {
        userId,
        chatId,
        conversationHistory,
        chatSummary: memoryContext.chatSummaryText,
      });

      assistantContent = agentResult.content;
      agentType = agentResult.agentType || "unknown";
      confidence = agentResult.confidence || 0;
    } catch (error) {
      console.error("Agent pipeline error during edit resubmit:", error);
    }

    const assistantMessage = await messageRepository.create({
      chatId,
      role: "assistant",
      content: assistantContent,
    });

    await messageRepository.updateAgentMetadata(assistantMessage.id, {
      agentType,
      confidence,
    });

    return { userMessage: updatedUserMessage, assistantMessage };
  }
}

export const messageService = new MessageService();
