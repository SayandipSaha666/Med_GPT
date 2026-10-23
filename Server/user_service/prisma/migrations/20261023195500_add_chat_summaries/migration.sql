-- CreateTable
CREATE TABLE "chat_summaries" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "chief_complaints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "symptoms_detail" TEXT,
    "diagnoses_discussed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clinical_advice" TEXT,
    "medications_mentioned" JSONB NOT NULL DEFAULT '[]',
    "allergies_noted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primary_department" TEXT,
    "urgency_level" TEXT NOT NULL DEFAULT 'routine',
    "pending_actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "compacted_text" TEXT NOT NULL,
    "message_count_at_compaction" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_summaries_chat_id_key" ON "chat_summaries"("chat_id");

-- CreateIndex
CREATE INDEX "chat_summaries_user_id_updated_at_idx" ON "chat_summaries"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "chat_summaries_user_id_primary_department_idx" ON "chat_summaries"("user_id", "primary_department");

-- AddForeignKey
ALTER TABLE "chat_summaries" ADD CONSTRAINT "chat_summaries_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_summaries" ADD CONSTRAINT "chat_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
