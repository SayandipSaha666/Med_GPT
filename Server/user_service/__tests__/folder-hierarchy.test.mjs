import assert from "node:assert/strict";
import { test } from "node:test";

const { assertValidFolderParent } = await import("../dist/src/services/folder-hierarchy.js");

test("allows a valid ancestor chain and removing a parent", async () => {
  const parents = new Map([[2, 1], [1, null]]);
  const load = async (id) => ({ parentId: parents.get(id) ?? null });
  await assertValidFolderParent(3, 2, load);
  await assertValidFolderParent(3, null, load);
});

test("rejects self-parenting and moving a folder under its descendant", async () => {
  const parents = new Map([[2, 1], [1, null]]);
  const load = async (id) => ({ parentId: parents.get(id) ?? null });
  await assert.rejects(assertValidFolderParent(1, 1, load), /Invalid folder hierarchy/);
  await assert.rejects(assertValidFolderParent(1, 2, load), /Invalid folder hierarchy/);
});
