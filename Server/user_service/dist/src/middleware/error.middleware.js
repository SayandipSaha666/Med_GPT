"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const multer_1 = __importDefault(require("multer"));
const app_error_1 = require("../errors/app-error");
function errorHandler(err, _req, res, _next) {
    if (err instanceof app_error_1.AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
}
