import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { runAgentPipeline, streamAgentPipeline } from "../index";
import type { AgentContext } from "../types";
import { env } from "../../../config/env";

const ConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  agentType: z.string().optional(),
  timestamp: z.union([z.string(), z.date()]).optional(),
});

const AgentContextSchema = z.object({
  userId: z.number(),
  chatId: z.number(),
  conversationHistory: z.array(ConversationMessageSchema).default([]),
  chatSummary: z.string().nullable().optional(),
  medicalProfile: z
    .object({
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      bloodGroup: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
      medications: z.array(z.string()).optional(),
    })
    .optional(),
});

const AgentRequestSchema = z.object({
  query: z.string().min(1),
  context: AgentContextSchema,
});

function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  if (!env.AGENT_SERVICE_API_KEY) {
    next();
    return;
  }

  if (req.header("x-internal-api-key") !== env.AGENT_SERVICE_API_KEY) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  next();
}

export const agentRouter = Router();

agentRouter.use(requireInternalAuth);

agentRouter.post("/respond", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = AgentRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: validation.error.issues[0]?.message ?? "Invalid request",
      });
      return;
    }

    const { query, context } = validation.data;
    const result = await runAgentPipeline(query, context as AgentContext);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

agentRouter.post("/stream", async (req: Request, res: Response) => {
  const validation = AgentRequestSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: validation.error.issues[0]?.message ?? "Invalid request",
    });
    return;
  }

  const { query, context } = validation.data;

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    for await (const chunk of streamAgentPipeline(query, context as AgentContext)) {
      if (res.writableEnded) break;
      res.write(`${JSON.stringify(chunk)}\n`);
    }
  } catch (error) {
    if (!res.writableEnded) {
      res.write(
        `${JSON.stringify({
          type: "error",
          content: "",
          metadata: { error: error instanceof Error ? error.message : "Unknown error" },
        })}\n`
      );
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});
