"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAgentTaskPublisher = startAgentTaskPublisher;
const amqplib_1 = __importDefault(require("amqplib"));
const prisma_1 = require("../lib/prisma");
const compaction_service_1 = require("./compaction.service");
const env_1 = require("../../config/env");
const QUEUE = "medgpt.agent.tasks.v1";
const POLL_INTERVAL_MS = 1000;
let connection;
let channel;
let connecting;
let flushing = false;
async function getChannel() {
    if (channel)
        return channel;
    if (connecting)
        return connecting;
    connecting = (async () => {
        if (!connection) {
            connection = await amqplib_1.default.connect(env_1.env.RABBITMQ_URL);
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
    }
    finally {
        connecting = undefined;
    }
}
async function publishQueuedTasks() {
    const tasks = await prisma_1.prisma.agentTask.findMany({
        where: { status: "queued", publishedAt: null },
        orderBy: { createdAt: "asc" },
        take: 25,
        select: { id: true },
    });
    if (!tasks.length)
        return;
    const queueChannel = await getChannel();
    for (const task of tasks) {
        await new Promise((resolve, reject) => {
            queueChannel.sendToQueue(QUEUE, Buffer.from(JSON.stringify({ taskId: task.id })), { persistent: true, contentType: "application/json", messageId: task.id }, (error) => error ? reject(error) : resolve());
        });
        await prisma_1.prisma.agentTask.updateMany({
            where: { id: task.id, status: "queued", publishedAt: null },
            data: { publishedAt: new Date() },
        });
    }
}
async function recoverExpiredTasks() {
    const now = new Date();
    await prisma_1.prisma.agentTask.updateMany({
        where: { status: "running", leaseExpiresAt: { lt: now } },
        data: { status: "queued", publishedAt: null, leaseExpiresAt: null },
    });
}
async function compactCompletedTasks() {
    const completed = await prisma_1.prisma.agentTask.findMany({
        where: { status: "completed", compactedAt: null },
        orderBy: { completedAt: "asc" },
        take: 5,
        select: { id: true, chatId: true, userId: true },
    });
    for (const task of completed) {
        try {
            const needed = await compaction_service_1.compactionService.shouldCompact(task.chatId);
            if (needed) {
                await compaction_service_1.compactionService.compactChat(task.chatId, task.userId);
                // compactChat returns null on transient summarizer failures; retain the
                // completed chat data and avoid retrying the same failed task forever.
            }
            await prisma_1.prisma.agentTask.updateMany({
                where: { id: task.id, compactedAt: null },
                data: { compactedAt: new Date() },
            });
        }
        catch (error) {
            console.error(`[Agent Queue] Compaction failed for task ${task.id}:`, error);
        }
    }
}
async function flush() {
    if (flushing)
        return;
    flushing = true;
    try {
        await recoverExpiredTasks();
        await publishQueuedTasks();
        await compactCompletedTasks();
    }
    catch (error) {
        console.error("[Agent Queue] Publisher cycle failed; queued tasks will retry:", error);
        const staleChannel = channel;
        const staleConnection = connection;
        channel = undefined;
        connection = undefined;
        await staleChannel?.close().catch(() => undefined);
        await staleConnection?.close().catch(() => undefined);
    }
    finally {
        flushing = false;
    }
}
function startAgentTaskPublisher() {
    void flush();
    const timer = setInterval(() => void flush(), POLL_INTERVAL_MS);
    timer.unref();
    console.log("[Agent Queue] RabbitMQ task publisher started");
}
