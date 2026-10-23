"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
// Public routes
router.post("/register", userController_1.userController.register);
router.post("/login", userController_1.userController.login);
router.post("/refresh", userController_1.userController.refresh);
// Protected routes
router.put("/profile", auth_middleware_1.authMiddleware, userController_1.userController.updateProfile);
router.get("/auth", auth_middleware_1.authMiddleware, userController_1.userController.getMe);
// Logout (protected route but no auth check needed since it clears cookies)
router.post("/logout", userController_1.userController.logout);
exports.default = router;
