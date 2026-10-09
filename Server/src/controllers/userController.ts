import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { RegisterSchema, LoginSchema, UpdateProfileSchema } from "../schema/user.schema";
import type { AuthResponse } from "../dto/user.dto";
import jwt from "jsonwebtoken";

export class UserController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = RegisterSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0].message,
        });
        return;
      }

      // Use type assertion since Zod safeParse returns broader types
      const user = await userService.register(validation.data as Parameters<typeof userService.register>[0]);

      // Generate tokens
      const accessToken = await userService.generateAccessToken(user.id);
      const refreshToken = await userService.generateRefreshToken(user.id);

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = LoginSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0].message,
        });
        return;
      }

      // Use type assertion since Zod safeParse returns broader types
      const authData = await userService.login(validation.data as Parameters<typeof userService.login>[0]);

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", authData.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/user/refresh",
      });

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const validation = UpdateProfileSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: validation.error.errors[0].message,
        });
        return;
      }

      const user = await userService.updateProfile(userId, validation.data.name);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const user = await userService.getProfile(userId);

      res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: "Refresh token not found",
        });
        return;
      }

      const userId = await userService.verifyRefreshToken(refreshToken);
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Invalid or expired refresh token",
        });
        return;
      }

      // Token rotation - generate new tokens
      const newAccessToken = await userService.generateAccessToken(userId);
      const newRefreshToken = await userService.generateRefreshToken(userId);

      // Set new refresh token in cookie
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
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
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
