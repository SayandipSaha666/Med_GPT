/** Preserve traversal order while ignoring duplicate or deleted knowledge entries. */
export function matchedKnowledgeResourceIds(requestedIds: readonly string[], existingIds: ReadonlySet<string>): string[] {
  return [...new Set(requestedIds)].filter((id) => existingIds.has(id));
}
