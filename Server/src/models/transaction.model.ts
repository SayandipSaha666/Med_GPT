// Transaction model
import { prisma } from "../lib/prisma";
import { Prisma, TransactionStatus } from "../generated/prisma-client";

export class TransactionModel {
  async findById(id: number) {
    return prisma.transaction.findUnique({ where: { id } });
  }

  async findByRazorpayOrderId(orderId: string) {
    return prisma.transaction.findUnique({
      where: { razorpayOrderId: orderId },
    });
  }

  async create(data: {
    userId: number;
    planId: number;
    amount: number | Prisma.Decimal;
    razorpayOrderId: string;
    isPaid?: boolean;
    status?: TransactionStatus;
    credits?: number | Prisma.Decimal;
  }) {
    return prisma.transaction.create({
      data: {
        ...data,
        status: data.status ?? TransactionStatus.PENDING,
      },
    });
  }

  async update(id: number, data: Prisma.TransactionUncheckedUpdateInput) {
    return prisma.transaction.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.transaction.delete({ where: { id } });
  }
}

export const transactionModel = new TransactionModel();
