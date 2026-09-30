import { prisma } from "../lib/prisma";
import type { Transaction, Plan } from "../dto/transaction.dto";

export class TransactionRepository {
  async findById(id: number): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { id },
    });
  }

  async findByRazorpayOrderId(orderId: string): Promise<Transaction | null> {
    return prisma.transaction.findUnique({
      where: { razorpayOrderId: orderId },
    });
  }

  async findManyByUserId(userId: number): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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
  }): Promise<Transaction> {
    return prisma.transaction.create({
      data,
    });
  }

  async update(id: number, data: Partial<Transaction>): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.transaction.delete({
      where: { id },
    });
  }
}

export class PlanRepository {
  async findAll(): Promise<Plan[]> {
    return prisma.plans.findMany({
      orderBy: { price: "asc" },
    });
  }

  async findById(id: number): Promise<Plan | null> {
    return prisma.plans.findUnique({
      where: { id },
    });
  }

  async findFirst(): Promise<Plan | null> {
    return prisma.plans.findFirst();
  }
}

export const transactionRepository = new TransactionRepository();
export const planRepository = new PlanRepository();
