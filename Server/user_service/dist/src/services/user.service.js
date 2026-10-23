"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repositories/user.repository");
const env_1 = require("../../config/env");
const JWT_SECRET = env_1.env.JWT_SECRET_KEY;
const REFRESH_TOKEN_SECRET = env_1.env.REFRESH_TOKEN_SECRET || env_1.env.JWT_SECRET_KEY;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET_KEY environment variable is not set");
}
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const secret = JWT_SECRET;
const refreshSecret = REFRESH_TOKEN_SECRET;
// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days
class UserService {
    async register(payload) {
        // Check if email already exists
        const existingUser = await user_repository_1.userRepository.findByEmail(payload.email);
        if (existingUser) {
            throw new Error("User already exists");
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(payload.password, 10);
        // Create user
        const user = await user_repository_1.userRepository.create({
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            planId: 1, // Default to free plan
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            credits: user.credits,
            planId: user.planId,
            createdAt: user.createdAt,
        };
    }
    async login(payload) {
        // Find user by email
        const user = await user_repository_1.userRepository.findByEmail(payload.email);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(payload.password, user.password);
        if (!isValidPassword) {
            throw new Error("Invalid credentials");
        }
        // Generate access token (short-lived)
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id }, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
        // Generate refresh token (long-lived)
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, refreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                credits: user.credits,
                planId: user.planId,
                createdAt: user.createdAt,
            },
            accessToken,
            refreshToken,
        };
    }
    async generateAccessToken(userId) {
        return jsonwebtoken_1.default.sign({ id: userId }, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
    }
    async generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ id: userId }, refreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
    }
    async verifyRefreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, refreshSecret);
            return decoded.id;
        }
        catch (error) {
            return null;
        }
    }
    async getProfile(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            credits: user.credits,
            planId: user.planId,
            createdAt: user.createdAt,
        };
    }
    async updateProfile(userId, name) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        const updatedUser = await user_repository_1.userRepository.update(userId, { name });
        return {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            credits: updatedUser.credits,
            planId: updatedUser.planId,
            createdAt: updatedUser.createdAt,
        };
    }
    async logout(userId) {
        // Token is stored client-side, so logout just clears it on the client
        // If using server-side sessions, invalidation would happen here
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
