const { prisma } = require('../lib/prisma');
const joi = require('joi');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

const sendMessageSchema = joi.object({
    userId: joi.number().required(),
    content: joi.string().required().min(1).max(5000),
});

const sendMessage = async (req, res, next) => {
    const chatId = parseInt(req.params.id);
    const { userId, content } = req.body;

    // Validate input
    const { error } = sendMessageSchema.validate({ userId, content });
    if (error) {
        return res.status(422).json({ success: false, message: error.details[0].message });
    }

    if (!chatId) {
        return res.status(422).json({ success: false, message: "Invalid chat ID!" });
    }

    try {
        // 1. Verify chat exists and belongs to user
        const chat = await prisma.chat.findUnique({
            where: { id: chatId, userId: userId }
        });
        if (!chat) {
            return res.status(404).json({ success: false, message: "Chat not found!" });
        }

        // 2. Save user message to the database
        const userMessage = await prisma.message.create({
            data: {
                chatId: chatId,
                role: "user",
                content: content,
            }
        });

        // 3. Call the Python RAG service for AI response
        let assistantContent = "Sorry, I couldn't generate a response. Please try again.";
        let sources = [];

        // 3. Check if user has enough credits
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }
        if (user.credits < 1) {
            return res.status(402).json({ success: false, message: "Insufficient credits!" });
        }

        // 4. Deduct credits and call the Python RAG service for AI response
        try {
            const ragResponse = await fetch(`${RAG_SERVICE_URL}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: content }),
            });

            if (!ragResponse.ok) {
                throw new Error(`RAG service returned ${ragResponse.status}`);
            }

            const ragData = await ragResponse.json();
            assistantContent = ragData.answer;
            sources = ragData.sources || [];
            user.credits -= 1;
            await prisma.user.update({
                where: { id: userId },
                data: { credits: user.credits }
            });
        } catch (ragError) {
            console.error("RAG service error:", ragError.message);
            // Continue with fallback message — user message is already saved
        }

        // 5. Save assistant message to the database
        const assistantMessage = await prisma.message.create({
            data: {
                chatId: chatId,
                role: "assistant",
                content: assistantContent,
            }
        });

        // 6. Return both messages and sources to the client
        return res.status(201).json({
            success: true,
            message: "Message sent successfully!",
            userMessage,
            assistantMessage,
            sources,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Error sending message!" });
    }
};

module.exports = { sendMessage };
