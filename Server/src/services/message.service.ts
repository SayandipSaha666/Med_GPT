import { messageRepository } from "../repositories/message.repository";
import { chatRepository } from "../repositories/chat.repository";
import { userRepository } from "../repositories/user.repository";
import type { Message } from "../dto/message.dto";

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:8000";

export class MessageService {
  async sendMessage(
    userId: number,
    chatId: number,
    content: string
  ): Promise<{ userMessage: Message; assistantMessage: Message; sources: string[] }> {
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
    if (user.credits < 1) {
      throw new Error("Insufficient credits");
    }

    // Save user message
    const userMessage = await messageRepository.create({
      chatId,
      role: "user",
      content,
    });

    // Generate AI response
    let assistantContent = "Sorry, I couldn't generate a response. Please try again.";
    let sources: string[] = [];

    try {
      // Call RAG service
      const ragResponse = await fetch(`${RAG_SERVICE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: content }),
      });

      if (ragResponse.ok) {
        const ragData = await ragResponse.json();
        assistantContent = ragData.answer;
        sources = ragData.sources || [];

        // Deduct credits
        await userRepository.incrementCredits(userId, -1);
      }
    } catch (error) {
      console.error("RAG service error:", error);
      // Continue with fallback message - user message is already saved
    }

    // Save assistant message
    const assistantMessage = await messageRepository.create({
      chatId,
      role: "assistant",
      content: assistantContent,
    });

    return { userMessage, assistantMessage, sources };
  }
}

export const messageService = new MessageService();
