"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileController = exports.FileController = void 0;
const file_service_1 = require("../services/file.service");
const app_error_1 = require("../errors/app-error");
class FileController {
    constructor() {
        this.upload = async (req, res) => {
            const file = req.file;
            if (!file) {
                throw app_error_1.AppError.badRequest("No files provided");
            }
            const result = await file_service_1.fileService.upload({
                userId: req.user.id,
                buffer: file.buffer,
                originalName: file.originalname,
                mime: file.mimetype,
                size: file.size,
            });
            res.status(201).json(result);
        };
        this.getOne = async (req, res) => {
            res.json(await file_service_1.fileService.getById(req.params.id, req.user.id));
        };
        this.list = async (req, res) => {
            res.json(await file_service_1.fileService.list(req.user.id));
        };
        this.remove = async (req, res) => {
            await file_service_1.fileService.remove(req.params.id, req.user.id);
            res.status(204).end();
        };
    }
}
exports.FileController = FileController;
exports.fileController = new FileController();
