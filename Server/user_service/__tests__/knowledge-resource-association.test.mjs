import { test } from "node:test";
import assert from "node:assert/strict";

const { matchedKnowledgeResourceIds } = await import("../dist/src/repositories/knowledge-resource-association.js");

test("links only existing entries, once, in traversal order", () => {
  assert.deepEqual(
    matchedKnowledgeResourceIds(["b", "missing", "a", "b"], new Set(["a", "b"])),
    ["b", "a"],
  );
});
