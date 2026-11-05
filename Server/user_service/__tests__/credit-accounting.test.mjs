import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

const originalEnv = { ...process.env };

function restoreEnvironment() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, originalEnv);
}

function configureEnvironment() {
  Object.assign(process.env, {
    USER_SERVICE_PORT: "3000",
    DATABASE_URL: "postgresql://test:test@localhost:5432/medgpt_test",
    JWT_SECRET_KEY: "test-jwt-secret",
    REFRESH_TOKEN_SECRET: "test-refresh-secret",
    RAG_SERVICE_URL: "http://localhost:8000",
    AGENT_SERVICE_URL: "http://localhost:4000",
    RABBITMQ_URL: "amqp://localhost:5672",
    FRONTEND_ALLOWED_ORIGINS: "http://localhost:5173",
    RAZORPAY_KEY_ID: "test-razorpay-key",
    RAZORPAY_KEY_SECRET: "test-razorpay-secret",
    RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret",
    CLOUDINARY_CLOUD_NAME: "test-cloud",
    CLOUDINARY_API_KEY: "test-cloudinary-key",
    CLOUDINARY_API_SECRET: "test-cloudinary-secret",
    NODE_ENV: "test",
  });
}

function createTransactionClient({ activeTasks = [], task = null, cancelCount = 1 } = {}) {
  const calls = {
    agentTask: { findMany: [], findFirst: [], updateMany: [] },
    chat: { delete: [] },
    message: { deleteMany: [], update: [] },
    user: { update: [] },
  };

  return {
    calls,
    tx: {
      agentTask: {
        findMany: async (arguments_) => {
          calls.agentTask.findMany.push(arguments_);
          return activeTasks;
        },
        findFirst: async (arguments_) => {
          calls.agentTask.findFirst.push(arguments_);
          return task;
        },
        updateMany: async (arguments_) => {
          calls.agentTask.updateMany.push(arguments_);
          return { count: cancelCount };
        },
      },
      chat: {
        delete: async (arguments_) => {
          calls.chat.delete.push(arguments_);
        },
      },
      message: {
        deleteMany: async (arguments_) => {
          calls.message.deleteMany.push(arguments_);
        },
        update: async (arguments_) => {
          calls.message.update.push(arguments_);
        },
      },
      user: {
        update: async (arguments_) => {
          calls.user.update.push(arguments_);
        },
      },
    },
  };
}

async function importFresh(modulePath) {
  return import(`${modulePath}?test=${Date.now()}-${Math.random()}`);
}

async function loadWithMocks({ modulePath, mocks }) {
  configureEnvironment();
  const { mock, unmock } = await import("node:test");
  const sourceDirectory = new URL("../src/", import.meta.url);

  for (const [specifier, value] of Object.entries(mocks)) {
    mock.module(new URL(specifier, sourceDirectory), { exports: value });
  }

  try {
    return await importFresh(modulePath);
  } finally {
    for (const specifier of Object.keys(mocks)) {
      unmock(new URL(specifier, sourceDirectory));
    }
  }
}

afterEach(() => {
  restoreEnvironment();
});

test("deleting a chat cancels active tasks without refunding credits", async () => {
  const transaction = createTransactionClient({ activeTasks: [{ id: "task-1" }, { id: "task-2" }] });
  const chatRepository = {
    findById: async () => ({ id: 44, userId: 7, title: "Medical chat" }),
  };

  const { ChatService } = await loadWithMocks({
    modulePath: "../src/services/chat.service.ts",
    mocks: {
      "../repositories/chat.repository": { chatRepository },
      "../repositories/message.repository": { messageRepository: {} },
      "../lib/prisma": {
        prisma: {
          $transaction: async (callback) => callback(transaction.tx),
        },
      },
    },
  });

  await new ChatService().deleteChat(44, 7);

  assert.equal(transaction.calls.agentTask.updateMany.length, 1);
  assert.deepEqual(transaction.calls.chat.delete, [{ where: { id: 44 } }]);
  assert.deepEqual(transaction.calls.user.update, []);
});

test("cancelling an agent task preserves the consumed credit", async () => {
  const transaction = createTransactionClient({
    task: { id: "task-1", chatId: 44, userId: 7, assistantMessageId: 81 },
  });
  const request = {
    params: { id: "44", taskId: "task-1" },
    user: { id: 7 },
  };
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  const { MessageController } = await loadWithMocks({
    modulePath: "../src/controllers/messageController.ts",
    mocks: {
      "../services/message.service": { messageService: {} },
      "../clients/agent.client": { agentClient: {} },
      "../services/compaction.service": { compactionService: {} },
      "../lib/prisma": {
        prisma: {
          agentTask: {
            findFirst: async () => transaction.tx.agentTask.findFirst({}),
          },
          $transaction: async (callback) => callback(transaction.tx),
        },
      },
    },
  });

  await new MessageController().cancelAgentTask(request, response, assert.fail);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { success: true, message: "Agent task cancelled" });
  assert.equal(transaction.calls.message.update.length, 1);
  assert.deepEqual(transaction.calls.user.update, []);
});

test("deleting a message pair cancels its task without refunding credits", async () => {
  const transaction = createTransactionClient({ task: { id: "task-1" } });
  const chatRepository = {
    findById: async () => ({ id: 44, userId: 7, title: "Medical chat" }),
  };
  const messageRepository = {
    findById: async () => ({ id: 71, chatId: 44, role: "user", content: "Symptoms" }),
    findNextAssistantMessage: async () => ({ id: 72, chatId: 44, role: "assistant", content: "Response" }),
  };

  const { MessageService } = await loadWithMocks({
    modulePath: "../src/services/message.service.ts",
    mocks: {
      "../repositories/chat.repository": { chatRepository },
      "../repositories/message.repository": { messageRepository },
      "../repositories/user.repository": { userRepository: {} },
      "../repositories/chat-summary.repository": { chatSummaryRepository: {} },
      "./compaction.service": { compactionService: {} },
      "../clients/agent.client": { agentClient: {} },
      "../lib/prisma": {
        prisma: {
          $transaction: async (callback) => callback(transaction.tx),
        },
      },
    },
  });

  const result = await new MessageService().deleteMessagePair(7, 44, 71);

  assert.deepEqual(result, { deletedIds: [71, 72] });
  assert.equal(transaction.calls.agentTask.updateMany.length, 1);
  assert.deepEqual(transaction.calls.message.deleteMany, [{ where: { id: { in: [71, 72] } } }]);
  assert.deepEqual(transaction.calls.user.update, []);
});
