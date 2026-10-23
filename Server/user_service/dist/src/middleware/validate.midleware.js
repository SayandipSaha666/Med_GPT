"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const app_error_1 = require("../errors/app-error");
const validate = (schema, source = "body") => (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        return next(app_error_1.AppError.badRequest(result.error.issues.map(i => i.message).join(", ")));
    }
    req[source] = result.data;
    next();
};
exports.validate = validate;
