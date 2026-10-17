// src/controllers/file.controller.ts
import type { Request, Response } from "express";
import { fileService } from "../services/file.service";
import { AppError } from "../errors/app-error";
import { FileResponseDto } from "../dto/file.dto";

export class FileController {
    upload = async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) {
            throw AppError.badRequest("No files provided");
        }

        const result: FileResponseDto = await fileService.upload({
            userId: req.user!.id,
            buffer: file.buffer,
            originalName: file.originalname,
            mime: file.mimetype,
            size: file.size,
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