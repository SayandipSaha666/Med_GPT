const { prisma } = require('../lib/prisma');
const Joi = require('joi');
const { razorpay } = require('../../config/razorpay');
const { validatePaymentVerification } = require('razorpay/dist/utils/razorpay-utils');

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

// ─── Step 2: Verify payment signature and grant credits ──────────────────────
const verifyPayment = async (req, res) => {
    try {
        // Validate request body
        const schema = Joi.object({
            razorpay_order_id: Joi.string().required(),
            razorpay_payment_id: Joi.string().required(),
            razorpay_signature: Joi.string().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = value;

        // Verify the payment signature using the official Razorpay SDK utility
        const isValid = validatePaymentVerification(
            { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
            razorpay_signature,
            process.env.RAZORPAY_KEY_SECRET
        );

        // Find the transaction linked to this order
        const transaction = await prisma.transaction.findUnique({
            where: { razorpayOrderId: razorpay_order_id },
        });
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found!",
            });
        }

        if (!isValid) {
            // Signature verification failed — mark as failed
            await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: "failed" },
            });
            return res.status(400).json({
                success: false,
                message: "Payment verification failed!",
            });
        }

        // Signature verified — update transaction and add credits
        const [updatedTransaction, updatedUser] = await prisma.$transaction([
            prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    isPaid: true,
                    status: "success",
                    razorpayPaymentId: razorpay_payment_id,
                },
            }),
            prisma.user.update({
                where: { id: transaction.userId },
                data: {
                    credits: { increment: transaction.credits },
                },
            }),
        ]);

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully!",
            data: {
                transaction: updatedTransaction,
                credits: updatedUser.credits,
            },
        });
    } catch (error) {
        console.error("verifyPayment error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error!",
        });
    }
};

module.exports = { getPlans, createOrder, verifyPayment };