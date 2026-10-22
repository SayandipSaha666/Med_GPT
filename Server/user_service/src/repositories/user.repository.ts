import { prisma } from "../lib/prisma";
import type { User } from "../dto/user.dto";
import { Prisma } from "../generated/prisma-client";

export class UserRepository {
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    planId?: number;
  }): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async incrementCredits(id: number, credits: number | Prisma.Decimal): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        credits: { increment: credits },
      },
    });
  }
}

export const userRepository = new UserRepository();
