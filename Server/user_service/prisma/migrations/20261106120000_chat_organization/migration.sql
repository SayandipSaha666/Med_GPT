CREATE TABLE "chat_pins" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "pinned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_pins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chat_pins_chat_id_key" ON "chat_pins"("chat_id");
CREATE INDEX "chat_pins_user_id_pinned_at_idx" ON "chat_pins"("user_id", "pinned_at");
ALTER TABLE "chat_pins" ADD CONSTRAINT "chat_pins_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_pins" ADD CONSTRAINT "chat_pins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "chat_folders" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT DEFAULT 'folder',
    "color" TEXT DEFAULT '#3b82f6',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_folders_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "chat_folders_user_id_sort_order_idx" ON "chat_folders"("user_id", "sort_order");
ALTER TABLE "chat_folders" ADD CONSTRAINT "chat_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "chat_folder_assignments" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "folder_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "chat_folder_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chat_folder_assignments_chat_id_folder_id_key" ON "chat_folder_assignments"("chat_id", "folder_id");
CREATE INDEX "chat_folder_assignments_folder_id_sort_order_idx" ON "chat_folder_assignments"("folder_id", "sort_order");
ALTER TABLE "chat_folder_assignments" ADD CONSTRAINT "chat_folder_assignments_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_folder_assignments" ADD CONSTRAINT "chat_folder_assignments_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "chat_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
