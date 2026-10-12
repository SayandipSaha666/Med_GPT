// src/errors/app-error.ts
export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }

    static badRequest(msg: string) { return new AppError(400, msg); }
    static unauthorized(msg = "Unauthorized") { return new AppError(401, msg); }
    static notFound(msg = "Not found") { return new AppError(404, msg); }
    static conflict(msg: string) { return new AppError(409, msg); }
}