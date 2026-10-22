// src/middlewares/validate.middleware.ts
import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../errors/app-error";

type Source = "body" | "params" | "query";

export const validate =
    (schema: ZodSchema, source: Source = "body") =>
        (req: Request, _res: Response, next: NextFunction) => {
            const result = schema.safeParse(req[source]);
            if (!result.success) {
                return next(AppError.badRequest(result.error.issues.map(i => i.message).join(", ")));
            }
            (req as any)[source] = result.data;
            next();
        };