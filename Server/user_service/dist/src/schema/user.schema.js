"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.RegisterSchema = zod_1.default.object({
    name: zod_1.default.string().min(1, "Name is required"),
    email: zod_1.default.string().email("Invalid email"),
    password: zod_1.default.string().min(6, "Password must be at least 6 characters"),
});
exports.LoginSchema = zod_1.default.object({
    email: zod_1.default.string().email("Invalid email"),
    password: zod_1.default.string().min(6, "Password must be at least 6 characters"),
});
exports.UpdateProfileSchema = zod_1.default.object({
    name: zod_1.default.string().min(1, "Name cannot be empty"),
});
