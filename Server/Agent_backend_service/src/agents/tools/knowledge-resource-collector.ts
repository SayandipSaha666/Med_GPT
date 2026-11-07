import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage<Set<string>>();

/** Run one response with an isolated list of KnowledgeEntry rows returned to its agent. */
export function withKnowledgeResourceCollector<T>(ids: Set<string>, work: () => Promise<T>): Promise<T> {
  return storage.run(ids, work);
}

export function recordKnowledgeResources(ids: readonly string[]): void {
  const collected = storage.getStore();
  if (!collected) return;
  for (const id of ids) collected.add(id);
}
