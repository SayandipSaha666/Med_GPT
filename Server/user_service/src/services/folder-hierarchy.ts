/** Reject self-parenting, cross-user ancestors, and cycles before changing a folder parent. */
export async function assertValidFolderParent(
  folderId: number,
  parentId: number | null | undefined,
  loadParent: (id: number) => Promise<{ parentId: number | null }>,
): Promise<void> {
  if (parentId == null) return;
  let next: number | null = parentId;
  const seen = new Set<number>();
  while (next != null) {
    if (next === folderId || seen.has(next)) throw new Error("Invalid folder hierarchy");
    seen.add(next);
    next = (await loadParent(next)).parentId;
  }
}
