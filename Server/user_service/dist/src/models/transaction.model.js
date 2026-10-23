"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionModel = exports.TransactionModel = void 0;
// Transaction model
const prisma_1 = require("../lib/prisma");
const prisma_client_1 = require("../generated/prisma-client");
class TransactionModel {
    async findById(id) {
        return prisma_1.prisma.transaction.findUnique({ where: { id } });
    }
    async findByRazorpayOrderId(orderId) {
        return prisma_1.prisma.transaction.findUnique({
            where: { razorpayOrderId: orderId },
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
        return prisma_1.prisma.transaction.update({ where: { id }, data });
    }
    async delete(id) {
        return prisma_1.prisma.transaction.delete({ where: { id } });
    }
}
exports.TransactionModel = TransactionModel;
exports.transactionModel = new TransactionModel();
