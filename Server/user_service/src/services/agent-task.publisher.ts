import amqp, { type ChannelModel, type ConfirmChannel } from "amqplib";
import { prisma } from "../lib/prisma";
import { compactionService } from "./compaction.service";
import { env } from "../../config/env";

const QUEUE = "medgpt.agent.tasks.v1";
const POLL_INTERVAL_MS = 1_000;

let connection: ChannelModel | undefined;
let channel: ConfirmChannel | undefined;
let connecting: Promise<ConfirmChannel> | undefined;
let flushing = false;

async function getChannel(): Promise<ConfirmChannel> {
  if (channel) return channel;
  if (connecting) return connecting;
  connecting = (async () => {
    if (!connection) {
      connection = await amqp.connect(env.RABBITMQ_URL);
      connection.on("error", (error) => {
        console.error("[Agent Queue] RabbitMQ error:", error.message);
      });
      connection.on("close", () => {
        connection = undefined;
        channel = undefined;
      });
    }
    const confirmChannel = await connection.createConfirmChannel();
    await confirmChannel.assertQueue(QUEUE, {
      durable: true,
    });
    channel = confirmChannel;
    confirmChannel.on("close", () => {
      channel = undefined;
    });
    return confirmChannel;
  })();

  try {
    return await connecting;
  } finally {
    connecting = undefined;
  }
}

async function publishQueuedTasks(): Promise<void> {
  const tasks = await prisma.agentTask.findMany({
    where: { status: "queued", publishedAt: null },
    orderBy: { createdAt: "asc" },
    take: 25,
    select: { id: true },
  });
  if (!tasks.length) return;

  const queueChannel = await getChannel();
  for (const task of tasks) {
    await new Promise<void>((resolve, reject) => {
      queueChannel.sendToQueue(
        QUEUE,
        Buffer.from(JSON.stringify({ taskId: task.id })),
        { persistent: true, contentType: "application/json", messageId: task.id },
        (error) => error ? reject(error) : resolve(),
      );
    });
    await prisma.agentTask.updateMany({
      where: { id: task.id, status: "queued", publishedAt: null },
      data: { publishedAt: new Date() },
    });
  }
}

async function recoverExpiredTasks(): Promise<void> {
  const now = new Date();
  await prisma.agentTask.updateMany({
    where: { status: "running", leaseExpiresAt: { lt: now } },
    data: { status: "queued", publishedAt: null, leaseExpiresAt: null },
  });
}

async function compactCompletedTasks(): Promise<void> {
  const completed = await prisma.agentTask.findMany({
    where: { status: "completed", compactedAt: null },
    orderBy: { completedAt: "asc" },
    take: 5,
    select: { id: true, chatId: true, userId: true },
  });

  for (const task of completed) {
    try {
      const needed = await compactionService.shouldCompact(task.chatId);
      if (needed) {
        await compactionService.compactChat(task.chatId, task.userId);
        // compactChat returns null on transient summarizer failures; retain the
        // completed chat data and avoid retrying the same failed task forever.
      }
      await prisma.agentTask.updateMany({
        where: { id: task.id, compactedAt: null },
        data: { compactedAt: new Date() },
      });
    } catch (error) {
      console.error(`[Agent Queue] Compaction failed for task ${task.id}:`, error);
    }
  }
}

async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    await recoverExpiredTasks();
    await publishQueuedTasks();
    await compactCompletedTasks();
  } catch (error) {
    console.error("[Agent Queue] Publisher cycle failed; queued tasks will retry:", error);
    const staleChannel = channel;
    const staleConnection = connection;
    channel = undefined;
    connection = undefined;
    await staleChannel?.close().catch(() => undefined);
    await staleConnection?.close().catch(() => undefined);
  } finally {
    flushing = false;
  }
}

export function startAgentTaskPublisher(): void {
  void flush();
  const timer = setInterval(() => void flush(), POLL_INTERVAL_MS);
  timer.unref();
  console.log("[Agent Queue] RabbitMQ task publisher started");
}

