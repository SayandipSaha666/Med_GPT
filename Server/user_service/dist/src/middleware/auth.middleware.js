"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const env_1 = require("../../config/env");
const authMiddleware = async (req, res, next) => {
    // Check for token in Authorization header first (Bearer token from localStorage)
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    else {
        // Fallback to cookie token
        token = req.cookies?.token;
    }
    if (!token) {
        res.status(401).json({
            success: false,
            message: "Unauthorized - No token provided",
        });
        return;
    }
    try {
        const secret = env_1.env.JWT_SECRET_KEY;
        if (!secret) {
            res.status(500).json({
                success: false,
                message: "JWT_SECRET_KEY not configured",
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                name: true,
                email: true,
                credits: true,
                planId: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Unauthorized - Invalid token",
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            res.status(401).json({
                success: false,
                message: "Unauthorized - Token expired",
            });
            return;
        }
        if (error.name === "JsonWebTokenError") {
            res.status(401).json({
                success: false,
                message: "Unauthorized - Invalid token",
            });
            return;
        }
        console.error("Auth middleware unexpected error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.authMiddleware = authMiddleware;
