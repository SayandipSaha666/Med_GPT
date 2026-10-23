"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const JWT_SECRET = env_1.env.JWT_SECRET_KEY;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET_KEY environment variable is not set");
}
// Bypass strict type checking for jsonwebtoken
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const signed = jsonwebtoken_1.default.sign;
function generateToken(id, expiresIn = "24h") {
    return signed({ id }, JWT_SECRET, { expiresIn });
}
exports.default = generateToken;
