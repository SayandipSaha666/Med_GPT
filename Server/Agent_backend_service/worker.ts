import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from "amqplib";
import { connectDB, prisma } from "./src/lib/prisma";
import { streamAgentPipeline } from "./src/agents";
import type { AgentContext, StreamChunk } from "./src/agents/types";
import { env } from "./config/env";

const QUEUE = "medgpt.agent.tasks.v1";
const MAX_ATTEMPTS = 3;
const LEASE_MS = 90_000;
const MAX_TASK_RUNTIME_MS = 12 * 60_000;
const FAILURE_TEXT = "I couldn't complete this response. Your credit has been returned. Please try again.";

type QueueMessage = { taskId: string };

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown task processing error";
}

async function updateProgress(
  taskId: string,
  assistantMessageId: number,
  status: string,
  progressMessage: string,
  agentType?: string,
  content?: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.agentTask.update({
      where: { id: taskId },
      data: { status: "running", agentType, error: null, leaseExpiresAt: new Date(Date.now() + LEASE_MS) },
    }),
    prisma.message.update({
      where: { id: assistantMessageId },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(agentType ? { agentType } : {}),
        metadata: { taskId, generationStatus: status, progressMessage },
      },
    }),
  ]);
}

async function retryOrFail(taskId: string, assistantMessageId: number, userId: number, attempts: number, error: string): Promise<void> {
  if (attempts < MAX_ATTEMPTS) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.agentTask.updateMany({
        where: { id: taskId, status: "running" },
        data: { status: "queued", publishedAt: null, leaseExpiresAt: null, error },
      });
      if (!updated.count) return;
      await tx.message.update({
        where: { id: assistantMessageId },
        data: {
          content: "",
          agentType: null,
          metadata: { taskId, generationStatus: "queued", progressMessage: "The agent service is retrying this request…" },
        },
      });
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.agentTask.updateMany({
      where: { id: taskId, status: "running" },
      data: { status: "failed", error, leaseExpiresAt: null, completedAt: new Date() },
    });
    if (!updated.count) return;
    await tx.message.update({
      where: { id: assistantMessageId },
      data: {
        content: FAILURE_TEXT,
        metadata: { taskId, generationStatus: "failed", progressMessage: "The response could not be generated." },
      },
    });
    await tx.user.update({ where: { id: userId }, data: { credits: { increment: 1 } } });
  });
}

async function processTask(taskId: string): Promise<void> {
  const task = await prisma.agentTask.findUnique({ where: { id: taskId } });
  if (!task || ["completed", "failed", "cancelled"].includes(task.status)) return;
  if (task.status === "running" && task.leaseExpiresAt && task.leaseExpiresAt > new Date()) return;

  const claimed = await prisma.agentTask.updateMany({
    where: {
      id: taskId,
      OR: [
        { status: "queued" },
        { status: "running", leaseExpiresAt: { lte: new Date() } },
      ],
    },
    data: {
      status: "running",
      attempts: { increment: 1 },
      startedAt: new Date(),
      leaseExpiresAt: new Date(Date.now() + LEASE_MS),
    },
  });
  if (!claimed.count) return;

  const current = await prisma.agentTask.findUnique({ where: { id: taskId } });
  if (!current) return;
  const context = current.context as unknown as AgentContext;
  let response = "";
  let agentType = "Unknown";
  let progressState = "routing";
  let progressMessage = "Finding the right specialist…";
  let pendingWrite = "";
  let lastPersistedAt = Date.now();
  const abortController = new AbortController();
  const taskTimeout = setTimeout(() => abortController.abort(), MAX_TASK_RUNTIME_MS);
  taskTimeout.unref();
  const heartbeat = setInterval(() => {
    void prisma.agentTask.findUnique({ where: { id: taskId }, select: { status: true } })
      .then((latest) => {
        if (!latest || latest.status === "cancelled") abortController.abort();
        else if (latest?.status === "running") {
          return prisma.agentTask.updateMany({
            where: { id: taskId, status: "running" },
            data: { leaseExpiresAt: new Date(Date.now() + LEASE_MS) },
          });
        }
      })
      .catch((error) => console.error(`[Agent Worker] Lease renewal failed for ${taskId}:`, error));
  }, 30_000);
  heartbeat.unref();
  const cancellationCheck = setInterval(() => {
    void prisma.agentTask.findUnique({ where: { id: taskId }, select: { status: true } })
      .then((latest) => { if (!latest || latest.status === "cancelled") abortController.abort(); })
      .catch((error) => console.error(`[Agent Worker] Cancellation check failed for ${taskId}:`, error));
  }, 1_000);
  cancellationCheck.unref();

  const persistPartial = async (force = false) => {
    if (!pendingWrite && !force) return;
    if (!force && pendingWrite.length < 80 && Date.now() - lastPersistedAt < 400) return;
    const text = response;
    pendingWrite = "";
    lastPersistedAt = Date.now();
    await prisma.message.update({
      where: { id: current.assistantMessageId },
      data: {
        content: text,
        agentType,
        metadata: { taskId, generationStatus: progressState, progressMessage },
      },
    });
  };

  try {
    await updateProgress(taskId, current.assistantMessageId, "routing", progressMessage);

    for await (const chunk of streamAgentPipeline(current.input, context, abortController.signal)) {
      if (chunk.type === "progress") {
        progressState = chunk.status ?? "generating";
        progressMessage = chunk.progressMessage ?? "Generating a response…";
        agentType = chunk.agentType ?? agentType;
        await updateProgress(taskId, current.assistantMessageId, progressState, progressMessage, agentType);
        continue;
      }

      if (chunk.type === "token") {
        response += chunk.content;
        pendingWrite += chunk.content;
        agentType = chunk.agentType ?? agentType;
        progressState = "generating";
        progressMessage = `Generating a response with ${agentType}…`;
        await persistPartial();
        continue;
      }

      if (chunk.type === "complete") {
        if (chunk.metadata?.error) throw new Error(chunk.metadata.error);
        response = chunk.content;
        agentType = chunk.agentType ?? agentType;
        await persistPartial(true);
      }
    }

    const latestTask = await prisma.agentTask.findUnique({ where: { id: taskId }, select: { status: true } });
    if (!latestTask || latestTask.status === "cancelled") return;

    const failed = agentType === "Error";
    await prisma.$transaction(async (tx) => {
      const updated = await tx.agentTask.updateMany({
        where: { id: taskId, status: "running" },
        data: {
          status: failed ? "failed" : "completed",
          agentType,
          error: failed ? response : null,
          leaseExpiresAt: null,
          completedAt: new Date(),
        },
      });
      if (!updated.count) return;
      await tx.message.update({
        where: { id: current.assistantMessageId },
        data: {
          content: failed ? FAILURE_TEXT : response,
          agentType,
          metadata: {
            taskId,
            generationStatus: failed ? "failed" : "completed",
            progressMessage: failed ? "The response could not be generated." : "Response complete.",
          },
        },
      });
      if (failed) {
        await tx.user.update({ where: { id: current.userId }, data: { credits: { increment: 1 } } });
      }
    });
  } catch (error) {
    console.error(`[Agent Worker] Task ${taskId} failed:`, error);
    const latestTask = await prisma.agentTask.findUnique({ where: { id: taskId }, select: { status: true } });
    if (!latestTask || latestTask.status === "cancelled") return;
    await retryOrFail(taskId, current.assistantMessageId, current.userId, current.attempts, errorText(error));
  } finally {
    clearInterval(heartbeat);
    clearInterval(cancellationCheck);
    clearTimeout(taskTimeout);
  }
}

async function handleDelivery(channel: Channel, message: ConsumeMessage | null): Promise<void> {
  if (!message) return;
  let payload: QueueMessage;
  try {
    payload = JSON.parse(message.content.toString("utf8")) as QueueMessage;
    if (!payload.taskId) throw new Error("Missing taskId in queue message");
  } catch (error) {
    console.error("[Agent Worker] Discarding invalid RabbitMQ message:", errorText(error));
    channel.ack(message);
    return;
  }

  try {
    await processTask(payload.taskId);
    channel.ack(message);
  } catch (error) {
    console.error(`[Agent Worker] Could not process task ${payload.taskId}:`, error);
    channel.nack(message, false, true);
  }
}

async function runConsumer(): Promise<void> {
  let retryDelayMs = 1_000;
  while (true) {
    let connection: ChannelModel | undefined;
    try {
      connection = await amqp.connect(env.RABBITMQ_URL);
      connection.on("error", (error) => console.error("[Agent Worker] RabbitMQ connection error:", error.message));
      const channel: Channel = await connection.createChannel();
      channel.on("error", (error) => console.error("[Agent Worker] RabbitMQ channel error:", error.message));
      channel.once("close", () => { void connection?.close().catch(() => undefined); });
      await channel.assertQueue(QUEUE, { durable: true });
      await channel.prefetch(1);
      await channel.consume(QUEUE, (message) => void handleDelivery(channel, message), { noAck: false });
      retryDelayMs = 1_000;
      console.log(`[Agent Worker] Listening on ${QUEUE}`);
      await new Promise<void>((resolve) => connection?.once("close", resolve));
    } catch (error) {
      console.error("[Agent Worker] RabbitMQ connection failed:", errorText(error));
    } finally {
      await connection?.close().catch(() => undefined);
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    retryDelayMs = Math.min(retryDelayMs * 2, 30_000);
  }
}

async function main(): Promise<void> {
  await connectDB();
  await runConsumer();
}

void main().catch((error) => {
  console.error("[Agent Worker] Fatal startup error:", error);
  process.exit(1);
});
