"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
// src/errors/app-error.ts
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
    static badRequest(msg) { return new AppError(400, msg); }
    static unauthorized(msg = "Unauthorized") { return new AppError(401, msg); }
    static notFound(msg = "Not found") { return new AppError(404, msg); }
    static conflict(msg) { return new AppError(409, msg); }
}
exports.AppError = AppError;
