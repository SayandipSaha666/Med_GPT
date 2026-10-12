import { Request, Response, NextFunction } from "express";
import { transactionService } from "../services/transaction.service";
import { CreateOrderSchema } from "../schema/transaction.schema";
import type { CreateOrderResponse, PaymentStatusResponse } from "../dto/transaction.dto";

export class TransactionController {
  async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await transactionService.getPlans();
      res.status(200).json({
        success: true,
        message: "Plans fetched successfully",
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = CreateOrderSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0].message,
        });
        return;
      }

      const { planId } = validation.data;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const orderData = await transactionService.createOrder(userId, planId);

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: orderData,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.query;
      const userId = req.user?.id;

      if (!orderId || typeof orderId !== "string") {
        res.status(400).json({
          success: false,
          message: "orderId query parameter is required",
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const status = await transactionService.getPaymentStatus(orderId, userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const result = await transactionService.processWebhook(payload, signature);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Webhook error:", error);
      // Return 200 to prevent infinite retries
      res.status(200).json({
        success: true,
        message: "Webhook received with errors",
      });
    }
  }
}

export const transactionController = new TransactionController();
