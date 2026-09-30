import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { userController } from "../controllers/userController";

const router = express.Router();

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);

// Protected routes
router.put("/profile", authMiddleware, userController.updateProfile);
router.get("/auth", authMiddleware, userController.getMe);

export default router;
