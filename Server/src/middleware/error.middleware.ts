// src/middlewares/error.middleware.ts
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../errors/app-error";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
}