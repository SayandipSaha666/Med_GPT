const { prisma } = require('../lib/prisma');
const Joi = require('joi');
const { razorpay } = require('../../config/razorpay');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');

// ─── Fetch all available plans ───────────────────────────────────────────────
const getPlans = async (req, res) => {
    try {
        const plans = await prisma.plans.findMany();
        if (plans.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No plans found!",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Plans fetched successfully!",
            data: plans,
        });
    } catch (error) {
        console.error("getPlans error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error!",
        });
    }
};

// ─── Step 1: Create a Razorpay order and a pending transaction ───────────────
const createOrder = async (req, res) => {
    try {
        // Validate request body
        const schema = Joi.object({
            planId: Joi.number().integer().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { planId } = value;
        const userId = req.user.id;

        // Look up the plan
        const plan = await prisma.plans.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found!",
            });
        }

        // Create Razorpay order (amount is in paise)
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(plan.price * 100),
            currency: "INR",
            receipt: `receipt_${userId}_${Date.now()}`,
            notes: {
                userId: String(userId),
                planId: String(planId),
            },
        });

        // Create a pending transaction linked to this order
        const transaction = await prisma.transaction.create({
            data: {
                userId: userId,
                planId: planId,
                amount: plan.price,
                razorpayOrderId: razorpayOrder.id,
                isPaid: false,
                status: "pending",
                credits: plan.credits,
            },
        });

        // Send order details to the frontend for Razorpay Checkout
        return res.status(201).json({
            success: true,
            message: "Order created successfully!",
            data: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                transactionId: transaction.id,
                keyId: process.env.RAZORPAY_KEY_ID,
            },
        });
    } catch (error) {
        console.error("createOrder error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error!",
        });
    }
};

// ─── Step 2: Razorpay webhook handler (server-to-server) ─────────────────────
// This endpoint is called by Razorpay's servers when a payment event occurs.
// It is NOT called by the frontend and does NOT use authMiddleware.
// The route is mounted in index.js with express.raw() to receive the raw body.
const handleWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        if (!signature) {
            return res.status(400).json({
                success: false,
                message: "Missing X-Razorpay-Signature header",
            });
        }

        // req.body is a Buffer because we use express.raw() for this route
        const rawBody = req.body.toString('utf-8');

        // Verify the webhook signature using the official Razorpay SDK utility
        const isValid = validateWebhookSignature(rawBody, signature, webhookSecret);
        if (!isValid) {
            console.error("Webhook signature verification failed");
            return res.status(400).json({
                success: false,
                message: "Invalid webhook signature",
            });
        }

        // Parse the verified payload
        const event = JSON.parse(rawBody);

        // Handle the payment.captured event
        if (event.event === 'payment.captured') {
            const paymentEntity = event.payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;
            const razorpayPaymentId = paymentEntity.id;

            // Find the transaction linked to this order
            const transaction = await prisma.transaction.findUnique({
                where: { razorpayOrderId: razorpayOrderId },
            });

            if (!transaction) {
                console.error(`Webhook: No transaction found for order ${razorpayOrderId}`);
                // Return 200 so Razorpay doesn't retry for an unknown order
                return res.status(200).json({ success: true, message: "No matching transaction" });
            }

            // Idempotency guard — if already processed, skip but return 200
            if (transaction.isPaid) {
                console.log(`Webhook: Transaction ${transaction.id} already processed, skipping`);
                return res.status(200).json({ success: true, message: "Already processed" });
            }

            // Atomically update the transaction and add credits to the user
            await prisma.$transaction([
                prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        isPaid: true,
                        status: "success",
                        razorpayPaymentId: razorpayPaymentId,
                    },
                }),
                prisma.user.update({
                    where: { id: transaction.userId },
                    data: {
                        credits: { increment: transaction.credits },
                    },
                }),
            ]);

            console.log(`Webhook: Payment captured for transaction ${transaction.id}, credits added`);
        }

        // Handle the payment.failed event
        if (event.event === 'payment.failed') {
            const paymentEntity = event.payload.payment.entity;
            const razorpayOrderId = paymentEntity.order_id;

            const transaction = await prisma.transaction.findUnique({
                where: { razorpayOrderId: razorpayOrderId },
            });

            if (transaction && !transaction.isPaid) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: "failed" },
                });
                console.log(`Webhook: Payment failed for transaction ${transaction.id}`);
            }
        }

        // Always return 200 to Razorpay to acknowledge receipt
        return res.status(200).json({ success: true, message: "Webhook received" });
    } catch (error) {
        console.error("handleWebhook error:", error);
        // Return 200 even on internal errors to prevent infinite retries
        // The error is logged for debugging
        return res.status(200).json({ success: true, message: "Webhook received" });
    }
};

// ─── Payment status polling endpoint (for frontend) ──────────────────────────
// After Razorpay Checkout closes, the frontend polls this endpoint to check
// whether the webhook has processed the payment yet.
const getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "orderId query parameter is required",
            });
        }

        const transaction = await prisma.transaction.findUnique({
            where: { razorpayOrderId: orderId },
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found!",
            });
        }

        // Ensure the authenticated user owns this transaction
        if (transaction.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access to this transaction",
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                status: transaction.status,
                isPaid: transaction.isPaid,
                credits: transaction.credits,
                amount: transaction.amount,
            },
        });
    } catch (error) {
        console.error("getPaymentStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error!",
        });
    }
};

module.exports = { getPlans, createOrder, handleWebhook, getPaymentStatus };