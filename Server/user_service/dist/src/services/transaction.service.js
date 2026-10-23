"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionService = exports.TransactionService = void 0;
const transaction_repository_1 = require("../repositories/transaction.repository");
const user_repository_1 = require("../repositories/user.repository");
const razorpay_1 = require("../../config/razorpay");
const prisma_client_1 = require("../generated/prisma-client");
const env_1 = require("../../config/env");
class TransactionService {
    async getPlans() {
        const plans = await transaction_repository_1.planRepository.findAll();
        return plans || [];
    }
    async createOrder(userId, planId) {
        // Find the plan
        const plan = await transaction_repository_1.planRepository.findById(planId);
        if (!plan) {
            throw new Error("Plan not found");
        }
        // Create Razorpay order
        const razorpayOrder = await razorpay_1.razorpay.orders.create({
            amount: Math.round(Number(plan.price) * 100),
            currency: "INR",
            receipt: `receipt_${userId}_${Date.now()}`,
            notes: {
                userId: String(userId),
                planId: String(planId),
            },
        });
        // Create transaction
        const transaction = await transaction_repository_1.transactionRepository.create({
            userId,
            planId,
            amount: plan.price,
            razorpayOrderId: razorpayOrder.id,
            isPaid: false,
            status: prisma_client_1.TransactionStatus.PENDING,
            credits: plan.credits,
        });
        return {
            orderId: razorpayOrder.id,
            amount: Number(razorpayOrder.amount),
            currency: razorpayOrder.currency,
            transactionId: transaction.id,
            keyId: env_1.env.RAZORPAY_KEY_ID || "",
        };
    }
    async getPaymentStatus(orderId, userId) {
        const transaction = await transaction_repository_1.transactionRepository.findByRazorpayOrderId(orderId);
        if (!transaction) {
            throw new Error("Transaction not found");
        }
        if (transaction.userId !== userId) {
            throw new Error("Unauthorized access to this transaction");
        }
        return {
            status: transaction.status,
            isPaid: transaction.isPaid,
            credits: transaction.credits,
            amount: transaction.amount,
        };
    }
    async processWebhook(payload, signature) {
        if (!signature) {
            return { success: false, message: "Missing signature" };
        }
        // Handle payment.captured event
        if (payload.event === "payment.captured") {
            const payment = payload.payload.payment;
            const razorpayOrderId = payment.order_id;
            const transaction = await transaction_repository_1.transactionRepository.findByRazorpayOrderId(razorpayOrderId);
            if (!transaction) {
                return { success: true, message: "No matching transaction" };
            }
            // Idempotency check
            if (transaction.isPaid) {
                return { success: true, message: "Already processed" };
            }
            // Update transaction
            await transaction_repository_1.transactionRepository.update(transaction.id, {
                isPaid: true,
                status: prisma_client_1.TransactionStatus.PAID,
                razorpayPaymentId: payment.id,
            });
            // Add credits to user
            await user_repository_1.userRepository.incrementCredits(transaction.userId, transaction.credits);
            console.log(`Webhook: Payment captured for transaction ${transaction.id}, credits added`);
        }
        // Handle payment.failed event
        if (payload.event === "payment.failed") {
            const payment = payload.payload.payment;
            const razorpayOrderId = payment.order_id;
            const transaction = await transaction_repository_1.transactionRepository.findByRazorpayOrderId(razorpayOrderId);
            if (transaction && !transaction.isPaid) {
                await transaction_repository_1.transactionRepository.update(transaction.id, { status: prisma_client_1.TransactionStatus.FAILED });
                console.log(`Webhook: Payment failed for transaction ${transaction.id}`);
            }
        }
        return { success: true, message: "Webhook received" };
    }
}
exports.TransactionService = TransactionService;
exports.transactionService = new TransactionService();
