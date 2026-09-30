import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { transactionController } from "../controllers/transactionController";

const router = express.Router();

// Public routes
router.get("/plans", transactionController.getPlans);

// Protected routes
router.post("/create-order", authMiddleware, transactionController.createOrder);
router.get("/payment-status", authMiddleware, transactionController.getPaymentStatus);

export default router;
