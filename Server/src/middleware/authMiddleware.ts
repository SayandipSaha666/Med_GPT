import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        credits: number;
        planId: number;
        createdAt: Date;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Unauthorized - No token provided",
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
      res.status(500).json({
        success: false,
        message: "JWT_SECRET_KEY not configured",
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload & { id: number };
    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
