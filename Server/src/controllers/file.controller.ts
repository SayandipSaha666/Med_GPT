// src/controllers/file.controller.ts
import type { Request, Response } from "express";
import { fileService } from "../services/file.service";
import { AppError } from "../errors/app-error";

export class FileController {
    upload = async (req: Request, res: Response) => {
        if (!req.file) throw AppError.badRequest("No file provided");

        const result = await fileService.upload({
            userId: req.user!.id,
            buffer: req.file.buffer,
            originalName: req.file.originalname,
            mime: req.file.mimetype,
            size: req.file.size,
        });
        res.status(201).json(result);
    };

    getOne = async (req: Request, res: Response) => {
        res.json(await fileService.getById(req.params.id as string, req.user!.id));
    };

    list = async (req: Request, res: Response) => {
        res.json(await fileService.list(req.user!.id));
    };

    remove = async (req: Request, res: Response) => {
        await fileService.remove(req.params.id as string, req.user!.id);
        res.status(204).end();
    };
}

export const fileController = new FileController();