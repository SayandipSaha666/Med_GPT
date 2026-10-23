"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planModel = exports.PlanModel = void 0;
// Plan model
const prisma_1 = require("../lib/prisma");
class PlanModel {
    async findAll() {
        return prisma_1.prisma.plans.findMany({ orderBy: { price: "asc" } });
    }
    async findById(id) {
        return prisma_1.prisma.plans.findUnique({ where: { id } });
    }
}
exports.PlanModel = PlanModel;
exports.planModel = new PlanModel();
