/*
  Warnings:

  - A unique constraint covering the columns `[razorpayOrderId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `razorpayOrderId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Transaction_userId_key";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "credits" DOUBLE PRECISION NOT NULL DEFAULT 200.0,
ADD COLUMN     "razorpayOrderId" TEXT NOT NULL,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_razorpayOrderId_key" ON "Transaction"("razorpayOrderId");
