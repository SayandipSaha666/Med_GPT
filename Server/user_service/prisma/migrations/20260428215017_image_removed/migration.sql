/*
  Warnings:

  - You are about to drop the column `isImage` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "isImage",
DROP COLUMN "isPublished";
