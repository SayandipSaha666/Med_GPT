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

      const secret = process.env.JWT_SECRET_KEY;
      if (!secret) {
        res.status(500).json({
          success: false,
          message: "JWT_SECRET_KEY not configured",
        });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = jwt.sign({ id: "temp" }, secret as any, {
        expiresIn: "24h",
      }) as string;

      // Use type assertion since Zod safeParse returns broader types
      const user = await userService.register(validation.data as Parameters<typeof userService.register>[0]);

      // Generate proper token with user id
      const userToken = jwt.sign({ id: user.id }, secret as any, {
        expiresIn: "24h",
      }) as string;

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: user,
        token: userToken,
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

      res.cookie("token", authData.token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: authData.user,
        token: authData.token,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 0,
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
}

export const userController = new UserController();
