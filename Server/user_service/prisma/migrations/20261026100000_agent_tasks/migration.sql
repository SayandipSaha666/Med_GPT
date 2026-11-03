CREATE TABLE "agent_tasks" (
    "id" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_message_id" INTEGER NOT NULL,
    "assistant_message_id" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "agent_type" TEXT,
    "error" TEXT,
    "published_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "lease_expires_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "compacted_at" TIMESTAMP(3),

    CONSTRAINT "agent_tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_tasks_assistant_message_id_key" ON "agent_tasks"("assistant_message_id");
CREATE UNIQUE INDEX "agent_tasks_user_message_id_key" ON "agent_tasks"("user_message_id");
CREATE INDEX "agent_tasks_status_published_at_created_at_idx" ON "agent_tasks"("status", "published_at", "created_at");
CREATE INDEX "agent_tasks_user_id_chat_id_created_at_idx" ON "agent_tasks"("user_id", "chat_id", "created_at");

ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_user_message_id_fkey" FOREIGN KEY ("user_message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_assistant_message_id_fkey" FOREIGN KEY ("assistant_message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
