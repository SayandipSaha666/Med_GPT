// src/types/express.d.ts
import type { Prisma } from "../generated/prisma-client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        credits: Prisma.Decimal | number;
        planId: number;
        createdAt: Date;
      };
    }
  }
}

export {};