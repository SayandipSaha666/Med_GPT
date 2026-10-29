// src/services/compaction.service.ts
import { prisma } from "../lib/prisma";
import { chatSummaryRepository, type UpsertChatSummaryInput } from "../repositories/chat-summary.repository";
import axios from "axios";
import { env } from "../../config/env";
import type { ConversationMessage } from "../types/agent.types";

export interface ChatMemoryContext {
    chatSummaryText: string | null;
    recentMessages: ConversationMessage[];
    hasSummary: boolean;
}

export class CompactionService {
    /**
     * Determines whether auto-compaction should trigger for a chat.
     * Compaction runs when total messages reach at least 6 and at least 4 new messages
     * have been added since the last compaction.
     */
    async shouldCompact(chatId: number): Promise<boolean> {
        const totalMessages = await prisma.message.count({ where: { chatId } });
        if (totalMessages < 6) return false;

        const summary = await chatSummaryRepository.findByChatId(chatId);
        const lastCount = summary?.messageCountAtCompaction || 0;

        return (totalMessages - lastCount) >= 4;
    }

    /**
     * Compacts the conversation up to the current turn into a structured clinical summary.
     */
    async compactChat(chatId: number, userId: number): Promise<UpsertChatSummaryInput | null> {
        const messages = await prisma.message.findMany({
            where: { chatId },
            orderBy: { timestamp: "asc" },
        });

        if (messages.length === 0) return null;

        const transcript = messages
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n\n");

        const prompt = `You are an expert clinical conversation summarizer. Analyze this patient-agent medical consultation transcript and extract a structured clinical memory state.

        Transcript:
        ${transcript}

        Instructions:
        1. Identify all chief complaints / symptoms mentioned by the user.
        2. Note duration, severity, and symptom details.
        3. List any differential diagnoses or medical conditions explored.
        4. Summarize medical recommendations, home care, and clinical triage advice given.
        5. Extract any medications discussed (with dosages and frequencies if mentioned).
        6. Note any drug or food allergies revealed.
        7. Determine the primary clinical department (e.g. general, cardiology, dermatology, dental, ent, gynecology, orthopedic, prescription).
        8. Determine clinical urgency (routine, soon, urgent, emergency).
        9. Write a dense, coherent 1-2 paragraph "compactedText" that captures the complete clinical state of this consultation so future agents can seamlessly resume context without reading past messages.

        Return ONLY a valid JSON object (no markdown fences, no extra text) matching this schema:
        {
        "chiefComplaints": ["symptom1", "symptom2"],
        "symptomsDetail": "Duration, onset, triggers, progression",
        "diagnosesDiscussed": ["condition A", "condition B"],
        "clinicalAdvice": "Triage and lifestyle advice given",
        "medicationsMentioned": [
            { "name": "Drug Name", "dosage": "500mg", "frequency": "twice daily", "status": "discussed/prescribed" }
        ],
        "allergiesNoted": ["allergy1"],
        "primaryDepartment": "general",
        "urgencyLevel": "routine",
        "pendingActions": ["Follow up with primary care physician", "Monitor temperature"],
        "compactedText": "Patient presented with... Advised to... Pending..."
        }`;

        try {
            const rawJson = await this.callLlmForSummary(prompt);
            const parsed = this.parseJsonSafely(rawJson);

            const input: UpsertChatSummaryInput = {
                userId,
                chiefComplaints: Array.isArray(parsed.chiefComplaints) ? parsed.chiefComplaints.map(String) : [],
                symptomsDetail: parsed.symptomsDetail ? String(parsed.symptomsDetail) : null,
                diagnosesDiscussed: Array.isArray(parsed.diagnosesDiscussed) ? parsed.diagnosesDiscussed.map(String) : [],
                clinicalAdvice: parsed.clinicalAdvice ? String(parsed.clinicalAdvice) : null,
                medicationsMentioned: Array.isArray(parsed.medicationsMentioned) ? parsed.medicationsMentioned : [],
                allergiesNoted: Array.isArray(parsed.allergiesNoted) ? parsed.allergiesNoted.map(String) : [],
                primaryDepartment: parsed.primaryDepartment ? String(parsed.primaryDepartment).toLowerCase() : null,
                urgencyLevel: parsed.urgencyLevel ? String(parsed.urgencyLevel).toLowerCase() : "routine",
                pendingActions: Array.isArray(parsed.pendingActions) ? parsed.pendingActions.map(String) : [],
                compactedText: parsed.compactedText ? String(parsed.compactedText) : "Consultation in progress.",
                messageCountAtCompaction: messages.length,
            };

            await chatSummaryRepository.upsert(chatId, input);
            console.log(`[CompactionService] Successfully compacted Chat ${chatId} (${messages.length} messages)`);

            return input;
        } catch (error) {
            console.error(`[CompactionService] Failed to compact chat ${chatId}:`, error);
            return null;
        }
    }

    /**
     * Auto-compacts asynchronously in the background if the chat meets compaction criteria.
     */
    async autoCompactIfNeeded(chatId: number, userId: number): Promise<void> {
        try {
            const needed = await this.shouldCompact(chatId);
            if (needed) {
                console.log(`[CompactionService] Auto-compaction triggered for chat ${chatId}`);
                await this.compactChat(chatId, userId);
            }
        } catch (err) {
            console.error(`[CompactionService] Error during auto-compaction check for chat ${chatId}:`, err);
        }
    }

    /**
     * Restores memory for a single chat:
     * - If a structured summary exists, provides the compacted summary + recent uncompacted messages.
     * - If no summary exists, provides the last 6 messages.
     */
    async getChatMemoryContext(chatId: number): Promise<ChatMemoryContext> {
        const summary = await chatSummaryRepository.findByChatId(chatId);

        if (summary) {
            // Fetch only the most recent messages (e.g. last 4 messages) to accompany the summary
            const recentRows = await prisma.message.findMany({
                where: { chatId },
                orderBy: { timestamp: "desc" },
                take: 4,
            });

            // Reverse to ascending chronological order
            const recentMessages: ConversationMessage[] = recentRows.reverse().map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

            return {
                chatSummaryText: summary.compactedText,
                recentMessages,
                hasSummary: true,
            };
        }

        // Fallback: If no compaction exists yet, fetch last 6 messages
        const recentRows = await prisma.message.findMany({
            where: { chatId },
            orderBy: { timestamp: "desc" },
            take: 6,
        });

        const recentMessages: ConversationMessage[] = recentRows.reverse().map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }));

        return {
            chatSummaryText: null,
            recentMessages,
            hasSummary: false,
        };
    }

    private async callLlmForSummary(prompt: string): Promise<string> {
        const provider = env.OCR_PROVIDER || "gemini";

        // Gemini OCR
        if (provider === "gemini") {
            const apiKey = env.GEMINI_OCR_API_KEY || process.env.GEMINI_OCR_API_KEY;
            if (!apiKey) {
                throw new Error("GEMINI_OCR_API_KEY not configured for compaction summarizer");
            }
            const modelName = env.GEMINI_OCR_MODEL || "gemini-2.0-flash-exp";
            console.log(`[CompactionService] Using Gemini for compaction with model: ${modelName}`);
            const res = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
                },
                { timeout: 30000 }
            );
            const content = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) return content;
        }

        // Groq OCR (OpenAI-compatible)
        else if (provider === "groq") {
            const apiKey = env.GROQ_OCR_API_KEY || process.env.GROQ_OCR_API_KEY;
            if (!apiKey) {
                throw new Error("GROQ_OCR_API_KEY not configured for compaction summarizer");
            }
            const modelName = env.GROQ_OCR_MODEL || "qwen/qwen-2.5-32b";
            console.log(`[CompactionService] Using Groq for compaction with model: ${modelName}`);
            const res = await axios.post(
                "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: modelName,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1,
                },
                {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
                    timeout: 30000,
                }
            );
            const content = res.data?.choices?.[0]?.message?.content;
            if (content) return content;
        }

        // OpenAI OCR
        else if (provider === "openai") {
            const apiKey = env.OPENAI_OCR_API_KEY || process.env.OPENAI_OCR_API_KEY;
            if (!apiKey) {
                throw new Error("OPENAI_OCR_API_KEY not configured for compaction summarizer");
            }
            const modelName = env.OPENAI_OCR_MODEL || "gpt-4o-2024-11-20";
            console.log(`[CompactionService] Using OpenAI for compaction with model: ${modelName}`);
            const res = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: modelName,
                    response_format: { type: "json_object" },
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.1,
                },
                {
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
                    timeout: 30000,
                }
            );
            const content = res.data?.choices?.[0]?.message?.content;
            if (content) return content;
        }

        throw new Error(`No LLM API keys configured for compaction summarizer with provider: ${provider}`);
    }

    private parseJsonSafely(raw: string): any {
        let cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        return JSON.parse(cleaned);
    }
}

export const compactionService = new CompactionService();
