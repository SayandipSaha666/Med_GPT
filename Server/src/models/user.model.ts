// User model
import { prisma } from "../lib/prisma";

export class UserModel {
  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    planId?: number;
  }) {
    return prisma.user.create({ data });
  }

  async update(id: number, data: Partial<any>) {
    return prisma.user.update({ where: { id }, data });
  }

  async incrementCredits(id: number, amount: number) {
    return prisma.user.update({
      where: { id },
      data: { credits: { increment: amount } },
    });
  }
}

export const userModel = new UserModel();
