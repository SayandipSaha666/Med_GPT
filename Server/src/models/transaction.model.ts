// Transaction model
import { prisma } from "../lib/prisma";

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
    amount: number;
    razorpayOrderId: string;
    isPaid?: boolean;
    status?: string;
    credits?: number;
  }) {
    return prisma.transaction.create({ data });
  }

  async update(id: number, data: Partial<any>) {
    return prisma.transaction.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.transaction.delete({ where: { id } });
  }
}

export const transactionModel = new TransactionModel();
