"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertValidFolderParent = assertValidFolderParent;
/** Reject self-parenting, cross-user ancestors, and cycles before changing a folder parent. */
async function assertValidFolderParent(folderId, parentId, loadParent) {
    if (parentId == null)
        return;
    let next = parentId;
    const seen = new Set();
    while (next != null) {
        if (next === folderId || seen.has(next))
            throw new Error("Invalid folder hierarchy");
        seen.add(next);
        next = (await loadParent(next)).parentId;
    }
}
