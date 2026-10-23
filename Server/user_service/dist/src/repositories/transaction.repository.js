"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planRepository = exports.transactionRepository = exports.PlanRepository = exports.TransactionRepository = void 0;
const prisma_1 = require("../lib/prisma");
const prisma_client_1 = require("../generated/prisma-client");
class TransactionRepository {
    async findById(id) {
        return prisma_1.prisma.transaction.findUnique({
            where: { id },
        });
    }
    async findByRazorpayOrderId(orderId) {
        return prisma_1.prisma.transaction.findUnique({
            where: { razorpayOrderId: orderId },
        });
    }
    async findManyByUserId(userId) {
        return prisma_1.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
    async create(data) {
        return prisma_1.prisma.transaction.create({
            data: {
                ...data,
                status: data.status ?? prisma_client_1.TransactionStatus.PENDING,
            },
        });
    }
    async update(id, data) {
        return prisma_1.prisma.transaction.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        await prisma_1.prisma.transaction.delete({
            where: { id },
        });
    }
}
exports.TransactionRepository = TransactionRepository;
class PlanRepository {
    async findAll() {
        return prisma_1.prisma.plans.findMany({
            orderBy: { price: "asc" },
        });
    }
    async findById(id) {
        return prisma_1.prisma.plans.findUnique({
            where: { id },
        });
    }
    async findFirst() {
        return prisma_1.prisma.plans.findFirst();
    }
}
exports.PlanRepository = PlanRepository;
exports.transactionRepository = new TransactionRepository();
exports.planRepository = new PlanRepository();
