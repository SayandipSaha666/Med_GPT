"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const user_schema_1 = require("../schema/user.schema");
const env_1 = require("../../config/env");
class UserController {
    async register(req, res, next) {
        try {
            const validation = user_schema_1.RegisterSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    message: validation.error.issues[0]?.message ?? "Validation failed",
                });
                return;
            }
            // Use type assertion since Zod safeParse returns broader types
            const user = await user_service_1.userService.register(validation.data);
            // Generate tokens
            const accessToken = await user_service_1.userService.generateAccessToken(user.id);
            const refreshToken = await user_service_1.userService.generateRefreshToken(user.id);
            // Set refresh token in HTTP-only cookie
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: "/api/user/refresh",
            });
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: {
                    user,
                    accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const validation = user_schema_1.LoginSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    message: validation.error.issues[0]?.message ?? "Validation failed",
                });
                return;
            }
            // Use type assertion since Zod safeParse returns broader types
            const authData = await user_service_1.userService.login(validation.data);
            // Set refresh token in HTTP-only cookie
            res.cookie("refreshToken", authData.refreshToken, {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: "/api/user/refresh",
            });
            res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    user: authData.user,
                    accessToken: authData.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/api/user/refresh",
            });
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const validation = user_schema_1.UpdateProfileSchema.safeParse(req.body);
            if (!validation.success) {
                res.status(400).json({
                    success: false,
                    message: validation.error.issues[0]?.message ?? "Validation failed",
                });
                return;
            }
            const user = await user_service_1.userService.updateProfile(userId, validation.data.name);
            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const user = await user_service_1.userService.getProfile(userId);
            res.status(200).json({
                success: true,
                message: "User fetched successfully",
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    message: "Refresh token not found",
                });
                return;
            }
            const userId = await user_service_1.userService.verifyRefreshToken(refreshToken);
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Invalid or expired refresh token",
                });
                return;
            }
            // Token rotation - generate new tokens
            const newAccessToken = await user_service_1.userService.generateAccessToken(userId);
            const newRefreshToken = await user_service_1.userService.generateRefreshToken(userId);
            // Set new refresh token in cookie
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: "/api/user/refresh",
            });
            res.status(200).json({
                success: true,
                message: "Token refreshed successfully",
                data: {
                    accessToken: newAccessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
