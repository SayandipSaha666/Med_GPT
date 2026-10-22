import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { connectDB } from "./src/lib/prisma";
import { agentRouter } from "./src/agents/api/agent.router";
import { env } from "./config/env";

const app = express();

if (env.AGENT_ALLOWED_ORIGINS?.length) {
  app.use(
    cors({
      origin: env.AGENT_ALLOWED_ORIGINS,
      methods: ["GET", "POST"],
      credentials: false,
    })
  );
}

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    service: "agent-service",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/agent", agentRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Agent Service] Unhandled error:", error);
  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : "Internal server error",
  });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.AGENT_SERVICE_PORT, () => {
      console.log(`Agent service is running on port ${env.AGENT_SERVICE_PORT}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

startServer();
