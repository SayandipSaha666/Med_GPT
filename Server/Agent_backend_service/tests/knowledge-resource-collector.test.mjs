import { test } from "node:test";
import assert from "node:assert/strict";

const { recordKnowledgeResources, withKnowledgeResourceCollector } = await import("../dist/src/agents/tools/knowledge-resource-collector.js");

test("collects unique IDs within the active response only", async () => {
  const first = new Set();
  const second = new Set();
  await Promise.all([
    withKnowledgeResourceCollector(first, async () => {
      recordKnowledgeResources(["entry-a", "entry-a"]);
      await new Promise((resolve) => setTimeout(resolve, 5));
      recordKnowledgeResources(["entry-b"]);
    }),
    withKnowledgeResourceCollector(second, async () => {
      recordKnowledgeResources(["entry-c"]);
    }),
  ]);
  recordKnowledgeResources(["outside"]);
  assert.deepEqual([...first], ["entry-a", "entry-b"]);
  assert.deepEqual([...second], ["entry-c"]);
});
