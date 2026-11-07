ALTER TABLE "chat_folders" ADD COLUMN "parent_id" INTEGER;
CREATE INDEX "chat_folders_parent_id_idx" ON "chat_folders"("parent_id");
ALTER TABLE "chat_folders" ADD CONSTRAINT "chat_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chat_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "message_knowledge_resources" (
    "message_id" INTEGER NOT NULL,
    "knowledge_entry_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "message_knowledge_resources_pkey" PRIMARY KEY ("message_id","knowledge_entry_id")
);
CREATE INDEX "message_knowledge_resources_knowledge_entry_id_idx" ON "message_knowledge_resources"("knowledge_entry_id");
ALTER TABLE "message_knowledge_resources" ADD CONSTRAINT "message_knowledge_resources_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_knowledge_resources" ADD CONSTRAINT "message_knowledge_resources_knowledge_entry_id_fkey" FOREIGN KEY ("knowledge_entry_id") REFERENCES "knowledge_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
