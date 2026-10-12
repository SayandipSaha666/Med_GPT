// Plan model
import { prisma } from "../lib/prisma";

export class PlanModel {
  async findAll() {
    return prisma.plans.findMany({ orderBy: { price: "asc" } });
  }

  async findById(id: number) {
    return prisma.plans.findUnique({ where: { id } });
  }
}

export const planModel = new PlanModel();
