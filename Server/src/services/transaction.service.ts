import { transactionRepository, planRepository } from "../repositories/transaction.repository";
import { userRepository } from "../repositories/user.repository";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const razorpay: any = require("../../config/razorpay");
import type { CreateOrderResponse, PaymentStatusResponse } from "../dto/transaction.dto";

export class TransactionService {
  async getPlans() {
    const plans = await planRepository.findAll();
    if (plans.length === 0) {
      throw new Error("No plans found");
    }
    return plans;
  }

  async createOrder(userId: number, planId: number): Promise<CreateOrderResponse> {
    // Find the plan
    const plan = await planRepository.findById(planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(plan.price * 100),
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId: String(userId),
        planId: String(planId),
      },
    });

    // Create transaction
    const transaction = await transactionRepository.create({
      userId,
      planId,
      amount: plan.price,
      razorpayOrderId: razorpayOrder.id,
      isPaid: false,
      status: "pending",
      credits: plan.credits,
    });

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      transactionId: transaction.id,
      keyId: process.env.RAZORPAY_KEY_ID || "",
    };
  }

  async getPaymentStatus(orderId: string, userId: number): Promise<PaymentStatusResponse> {
    const transaction = await transactionRepository.findByRazorpayOrderId(orderId);
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

  async processWebhook(payload: any, signature: string): Promise<{ success: boolean; message: string }> {
    if (!signature) {
      return { success: false, message: "Missing signature" };
    }

    const rawBody = JSON.stringify(payload);

    // Handle payment.captured event
    if (payload.event === "payment.captured") {
      const payment = payload.payload.payment;
      const razorpayOrderId = payment.order_id;

      const transaction = await transactionRepository.findByRazorpayOrderId(razorpayOrderId);
      if (!transaction) {
        return { success: true, message: "No matching transaction" };
      }

      // Idempotency check
      if (transaction.isPaid) {
        return { success: true, message: "Already processed" };
      }

      // Update transaction
      await transactionRepository.update(transaction.id, {
        isPaid: true,
        status: "success",
        razorpayPaymentId: payment.id,
      });

      // Add credits to user
      await userRepository.incrementCredits(transaction.userId, transaction.credits);

      console.log(`Webhook: Payment captured for transaction ${transaction.id}, credits added`);
    }

    // Handle payment.failed event
    if (payload.event === "payment.failed") {
      const payment = payload.payload.payment;
      const razorpayOrderId = payment.order_id;

      const transaction = await transactionRepository.findByRazorpayOrderId(razorpayOrderId);
      if (transaction && !transaction.isPaid) {
        await transactionRepository.update(transaction.id, { status: "failed" });
        console.log(`Webhook: Payment failed for transaction ${transaction.id}`);
      }
    }

    return { success: true, message: "Webhook received" };
  }
}

export const transactionService = new TransactionService();
