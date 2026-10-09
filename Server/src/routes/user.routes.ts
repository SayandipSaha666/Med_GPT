import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { userController } from "../controllers/userController";

const router = express.Router();

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/refresh", userController.refresh);

// Protected routes
router.put("/profile", authMiddleware, userController.updateProfile);
router.get("/auth", authMiddleware, userController.getMe);

// Logout (protected route but no auth check needed since it clears cookies)
router.post("/logout", userController.logout);

export default router;
