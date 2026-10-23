"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const transactionController_1 = require("../controllers/transactionController");
const router = express_1.default.Router();
// Public routes
router.get("/plans", transactionController_1.transactionController.getPlans);
// Protected routes
router.post("/create-order", auth_middleware_1.authMiddleware, transactionController_1.transactionController.createOrder);
router.get("/payment-status", auth_middleware_1.authMiddleware, transactionController_1.transactionController.getPaymentStatus);
exports.default = router;
