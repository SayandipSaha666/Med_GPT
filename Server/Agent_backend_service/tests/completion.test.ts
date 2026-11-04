import { test } from "node:test";
import assert from "node:assert/strict";
import { completionIssue } from "../src/agents/completion";

// Load the real pipeline with fake configuration. Runner and database calls below
// are replaced before execution; these tests use no external services.
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.RABBITMQ_URL = "amqp://localhost";
process.env.MODEL_PROVIDER = "openai";
process.env.OPENAI_AGENT_API_KEY = "test-only";
process.env.NODE_ENV = "test";
const { runner } = require("../src/agents/config/model.provider");
const { runAgentPipeline, streamAgentPipeline } = require("../src/agents");
const { gatewayAgent, selectFallbackAgent } = require("../src/agents/gateway/gateway.agent");
const { processTask } = require("../worker");
const { prisma } = require("../src/lib/prisma");

const notice = "Your request has been transferred to the Prescription Analyzer for a detailed recommendation.";
const productionNotice = "I’m handing off your request to the prescription-analysis specialist. They’ll review the uploaded prescription image and provide you with a detailed report on any conditions mentioned and the dosage information for each medication.\n\nPlease hold on while the analysis is completed.";
const answer = "I reviewed the prescription. Please confirm which medication you want explained with your pharmacist.";
const context = { userId: 1, chatId: 5, conversationHistory: [] };
const specialist = selectFallbackAgent("prescription");

function streamed(agent: any, output: string, delta = output) {
  return {
    lastAgent: agent, finalOutput: output, completed: Promise.resolve(),
    async *[Symbol.asyncIterator]() {
      yield { type: "agent_updated_stream_event", agent };
      if (delta) yield { type: "raw_model_stream_event", data: { type: "output_text_delta", delta } };
    },
  };
}

test("completion rejects empty and transfer-only replies, preserves substantive replies", () => {
  for (const value of ["", " \n "]) assert.equal(completionIssue(value), "empty");
  for (const value of [notice, productionNotice, "I'm transferring you to our Prescription Analyzer. Please wait.",
    productionNotice.replace(/[’]/g, "'"),
    productionNotice.replace("Please hold on while the analysis is completed.", "*Please hold on while the analysis is completed.*"),
    "I'm handing off your request. Meanwhile, please hold on.",
    "I'm handing off your request. " + "They will review the document and provide a report. ".repeat(20),
    "I've transferred your request to the Prescription Analyzer.",
    "I will hand off your case to a specialist."]) {
    assert.equal(completionIssue(value), "transfer_only", value);
  }
  for (const value of [answer, "Please consult a cardiologist for persistent symptoms.",
    "Your request has been transferred to a specialist. Seek urgent care for chest pain.",
    "I'm transferring your case to a specialist, but seek urgent care for severe chest pain.",
    "I cannot read the dosage. Could you confirm the medicine name?"]) {
    assert.equal(completionIssue(value), undefined, value);
  }
});

test("pipeline completion and worker regression scenarios", async (t) => {
  const originalRun = runner.run;
  t.after(() => { runner.run = originalRun; });

  await t.test("both pipelines recover the same specialist with original context and safety checks", async () => {
    for (const streaming of [false, true]) {
      const calls: any[] = [];
      runner.run = async (agent: any, input: any, options: any) => {
        calls.push({ agent, input, options });
        const output = calls.length === 1 ? notice : answer;
        return streaming ? streamed(specialist, output) : { lastAgent: specialist, finalOutput: output };
      };
      if (streaming) {
        const chunks = [];
        for await (const chunk of streamAgentPipeline("Review prescription", context)) chunks.push(chunk);
        assert.equal(chunks[chunks.length - 1].content, answer);
        const reset = chunks.findIndex((c, i) => i > 0 && c.reset);
        assert.ok(reset > chunks.findIndex((c) => c.type === "token" && c.content === notice));
        assert.equal(chunks[reset + 1].content, answer);
      } else {
        assert.equal((await runAgentPipeline("Review prescription", context)).content, answer);
      }
      assert.equal(calls.length, 2);
      assert.equal(calls[1].agent.name, specialist.name);
      assert.equal(calls[1].input, calls[0].input);
      assert.equal(calls[1].options.context, context);
      assert.equal(calls[1].agent.tools, specialist.tools);
      assert.equal(calls[1].agent.outputGuardrails, specialist.outputGuardrails);
      assert.match(await calls[1].agent.instructions({ context }, specialist), /already the selected specialist/);
    }
  });

  await t.test("production multi-sentence notice is recovered in both pipelines", async () => {
    for (const streaming of [false, true]) {
      let calls = 0;
      runner.run = async () => {
        const output = ++calls === 1 ? productionNotice : answer;
        return streaming ? streamed(specialist, output) : { lastAgent: specialist, finalOutput: output };
      };
      let result: any;
      if (streaming) for await (const chunk of streamAgentPipeline("prescription", context)) result = chunk;
      else result = await runAgentPipeline("prescription", context);
      assert.equal(result.content, answer);
      assert.equal(calls, 2);
    }
    const instructions = await specialist.instructions({ context }, specialist);
    assert.match(instructions, /already the Prescription Analyzer/);
    assert.match(instructions, /Use userId 1/);
  });

  await t.test("gateway fallback still runs and its specialist output is validated", async () => {
    for (const streaming of [false, true]) {
      let calls = 0;
      runner.run = async () => {
        calls++;
        const agent = calls === 1 ? gatewayAgent : specialist;
        const output = calls < 3 ? notice : answer;
        return streaming ? streamed(agent, output) : { lastAgent: agent, finalOutput: output };
      };
      let result: any;
      if (streaming) for await (const chunk of streamAgentPipeline("prescription", context)) result = chunk;
      else result = await runAgentPipeline("prescription", context);
      assert.equal(result.content, answer);
      assert.equal(calls, 3);
    }
  });

  await t.test("repeated transfer and empty responses fail after exactly one recovery", async () => {
    for (const output of [notice, productionNotice, ""]) for (const streaming of [false, true]) {
      let calls = 0;
      runner.run = async () => {
        calls++;
        return streaming ? streamed(specialist, output) : { lastAgent: specialist, finalOutput: output };
      };
      let result: any;
      if (streaming) for await (const chunk of streamAgentPipeline("prescription", context)) result = chunk;
      else result = await runAgentPipeline("prescription", context);
      assert.equal(calls, 2);
      assert.equal(result.agentType, "Error");
      assert.match(result.metadata.error, /incomplete after recovery/);
    }
  });

  await t.test("canonical final output replaces streamed preambles; valid answers are not retried", async () => {
    let calls = 0;
    runner.run = async () => { calls++; return streamed(specialist, answer, "Let me check. " + answer); };
    let result: any;
    for await (const chunk of streamAgentPipeline("prescription", context)) result = chunk;
    assert.equal(result.content, answer);
    assert.equal(calls, 1);
  });

  await t.test("empty drafts can recover and final-only output is preserved", async () => {
    for (const streaming of [false, true]) {
      let calls = 0;
      runner.run = async () => {
        calls++;
        const output = calls === 1 ? "" : answer;
        return streaming ? streamed(specialist, output, "") : { lastAgent: specialist, finalOutput: output };
      };
      let result: any;
      if (streaming) for await (const chunk of streamAgentPipeline("prescription", context)) result = chunk;
      else result = await runAgentPipeline("prescription", context);
      assert.equal(calls, 2);
      assert.equal(result.content, answer);
    }
  });

  await t.test("safety tripwires do not invoke completion recovery", async () => {
    for (const streaming of [false, true]) {
      let calls = 0;
      runner.run = async () => {
        calls++;
        throw { name: "InputGuardrailTripwireTriggered", outputInfo: JSON.stringify({ reason: "off_topic" }) };
      };
      let result: any;
      if (streaming) for await (const chunk of streamAgentPipeline("prescription", context)) result = chunk;
      else result = await runAgentPipeline("prescription", context);
      assert.equal(calls, 1);
      assert.equal(result.agentType, "SafetyFilter");
    }
  });

  await t.test("aborted recovery does not start another run", async () => {
    const controller = new AbortController();
    let calls = 0;
    runner.run = async () => { calls++; return streamed(specialist, notice); };
    for await (const chunk of streamAgentPipeline("prescription", context, controller.signal)) {
      if (chunk.type === "token") controller.abort();
    }
    assert.equal(calls, 1);
  });

  await t.test("worker resets rejected drafts, retries failures, and refunds only on final failure", async () => {
    // Prisma delegates are proxies, so the Node mock tracker cannot find their descriptors.
    const restore: Array<() => void> = [];
    const replace = (object: any, key: string, implementation: any) => {
      const original = object[key];
      object[key] = implementation;
      restore.push(() => { object[key] = original; });
    };
    t.after(() => restore.reverse().forEach((undo) => undo()));
    const task: any = { id: "test-task", status: "queued", attempts: 0,
      assistantMessageId: 16, userId: 1, input: "prescription", context };
    const message: any = { content: "" };
    const writes: any[] = [];
    let refunds = 0;
    replace(prisma.agentTask, "findUnique", async () => ({ ...task }));
    replace(prisma.agentTask, "updateMany", async ({ data, where }: any) => {
      if (where.status && task.status !== where.status) return { count: 0 };
      Object.assign(task, data, { attempts: data.attempts?.increment ? task.attempts + 1 : task.attempts });
      return { count: 1 };
    });
    replace(prisma.agentTask, "update", async ({ data }: any) => Object.assign(task, data));
    replace(prisma.message, "update", async ({ data }: any) => {
      Object.assign(message, data); writes.push({ ...message }); return message;
    });
    replace(prisma.user, "update", async () => { refunds++; return {}; });
    replace(prisma, "$transaction", async (operation: any) =>
      typeof operation === "function" ? operation(prisma) : Promise.all(operation));

    let calls = 0;
    runner.run = async () => { calls++; return streamed(specialist, calls === 1 ? productionNotice : answer); };
    await processTask(task.id);
    assert.equal(task.status, "completed");
    assert.equal(message.content, answer);
    const rejected = writes.findIndex((w) => w.content === productionNotice);
    assert.ok(rejected >= 0);
    assert.equal(writes[rejected + 1].content, "");
    assert.equal(refunds, 0);

    Object.assign(task, { status: "queued", attempts: 0 });
    runner.run = async () => streamed(specialist, productionNotice);
    for (let attempt = 1; attempt <= 3; attempt++) {
      await processTask(task.id);
      assert.equal(task.status, attempt < 3 ? "queued" : "failed");
      assert.equal(refunds, attempt < 3 ? 0 : 1);
    }
    assert.equal(message.metadata.generationStatus, "failed");
    assert.notEqual(message.content, productionNotice);
    await processTask(task.id);
    assert.equal(refunds, 1);
  });
});
