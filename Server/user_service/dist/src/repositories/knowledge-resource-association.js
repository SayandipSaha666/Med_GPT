"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchedKnowledgeResourceIds = matchedKnowledgeResourceIds;
/** Preserve traversal order while ignoring duplicate or deleted knowledge entries. */
function matchedKnowledgeResourceIds(requestedIds, existingIds) {
    return [...new Set(requestedIds)].filter((id) => existingIds.has(id));
}
