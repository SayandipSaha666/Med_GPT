-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "KnowledgeSource" AS ENUM ('WEB_SEARCH', 'UPLOADED_DOCUMENT', 'MEDICAL_GUIDELINE', 'HOSPITAL_DATA', 'AGENT_LEARNING', 'MANUAL_ENTRY');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "agent_metadata" JSONB,
ADD COLUMN     "agent_type" TEXT,
ADD COLUMN     "confidence" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "medical_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date_of_birth" TEXT,
    "gender" TEXT,
    "blood_group" TEXT,
    "allergies_encrypted" TEXT,
    "conditions_encrypted" TEXT,
    "medications_encrypted" TEXT,
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "emergency_escalation" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_id" TEXT NOT NULL,
    "doctor_name" TEXT,
    "patient_name" TEXT,
    "date_issued" TIMESTAMP(3),
    "raw_text" TEXT NOT NULL,
    "medications" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "recommendations" JSONB NOT NULL DEFAULT '[]',
    "overall_assessment" TEXT,
    "extraction_model" TEXT NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "processing_time_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "hospital_name" TEXT NOT NULL,
    "hospital_address" TEXT,
    "department" TEXT NOT NULL,
    "doctor_name" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "calendar_event_id" TEXT,
    "external_booking_id" TEXT,
    "notes" TEXT,
    "reminder_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_entries" (
    "id" TEXT NOT NULL,
    "source" "KnowledgeSource" NOT NULL,
    "source_url" TEXT,
    "department" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "pinecone_id" TEXT,
    "embedding_model" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_logs" (
    "id" TEXT NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "message_id" INTEGER,
    "agent_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "input" TEXT,
    "output" TEXT,
    "latency_ms" INTEGER NOT NULL,
    "tokens_used" INTEGER,
    "model_used" TEXT,
    "guardrail_results" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medical_profiles_user_id_key" ON "medical_profiles"("user_id");

-- CreateIndex
CREATE INDEX "prescriptions_user_id_created_at_idx" ON "prescriptions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "appointments_user_id_scheduled_at_idx" ON "appointments"("user_id", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_entries_content_hash_key" ON "knowledge_entries"("content_hash");

-- CreateIndex
CREATE INDEX "knowledge_entries_department_source_idx" ON "knowledge_entries"("department", "source");

-- CreateIndex
CREATE INDEX "agent_logs_chat_id_created_at_idx" ON "agent_logs"("chat_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_logs_agent_type_created_at_idx" ON "agent_logs"("agent_type", "created_at");

-- AddForeignKey
ALTER TABLE "medical_profiles" ADD CONSTRAINT "medical_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
