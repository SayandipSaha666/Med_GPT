"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionController = exports.TransactionController = void 0;
const transaction_service_1 = require("../services/transaction.service");
const transaction_schema_1 = require("../schema/transaction.schema");
class TransactionController {
    async getPlans(req, res, next) {
        try {
            const plans = await transaction_service_1.transactionService.getPlans();
            res.status(200).json({
                success: true,
                message: "Plans fetched successfully",
                data: plans,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createOrder(req, res, next) {
        try {
            const validation = transaction_schema_1.CreateOrderSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    message: validation.error.issues[0]?.message ?? "Validation failed",
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
            const orderData = await transaction_service_1.transactionService.createOrder(userId, planId);
            res.status(201).json({
                success: true,
                message: "Order created successfully",
                data: orderData,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPaymentStatus(req, res, next) {
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
            const status = await transaction_service_1.transactionService.getPaymentStatus(orderId, userId);
            res.status(200).json({
                success: true,
                data: status,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async handleWebhook(req, res, next) {
        try {
            const signature = req.headers["x-razorpay-signature"];
            const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
            const result = await transaction_service_1.transactionService.processWebhook(payload, signature);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            console.error("Webhook error:", error);
            // Return 200 to prevent infinite retries
            res.status(200).json({
                success: true,
                message: "Webhook received with errors",
            });
        }
    }
}
exports.TransactionController = TransactionController;
exports.transactionController = new TransactionController();
