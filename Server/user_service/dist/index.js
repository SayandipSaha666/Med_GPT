"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
const prisma_1 = require("./src/lib/prisma");
const auth_middleware_1 = require("./src/middleware/auth.middleware");
const transactionController_1 = require("./src/controllers/transactionController");
const user_routes_1 = __importDefault(require("./src/routes/user.routes"));
const chat_routes_1 = __importDefault(require("./src/routes/chat.routes"));
const file_route_1 = __importDefault(require("./src/routes/file.route"));
const billing_routes_1 = __importDefault(require("./src/routes/billing.routes"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
const allowedOrigins = env_1.env.FRONTEND_ALLOWED_ORIGINS;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes("*")) {
            callback(null, true);
        }
        else if (allowedOrigins.includes(origin)) {
            callback(null, origin);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
// Razorpay webhook route — mounted BEFORE express.json() to receive raw body
// for HMAC signature verification. Does NOT use authMiddleware (server-to-server).
app.post("/api/billing/webhook", express_1.default.raw({ type: "application/json" }), transactionController_1.transactionController.handleWebhook);
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json());
const PORT = env_1.env.USER_SERVICE_PORT;
// Mount routers
app.use("/api/user", user_routes_1.default);
app.use("/api/files", file_route_1.default);
app.use("/api/chat", auth_middleware_1.authMiddleware, chat_routes_1.default);
app.use("/api/billing", auth_middleware_1.authMiddleware, billing_routes_1.default);
// Health check route (for Render monitoring)
app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        service: "user-service",
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
app.use("/api", (_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});
const startServer = async () => {
    try {
        await (0, prisma_1.connectDB)();
        app.listen(PORT, () => {
            console.log(`User service running on port ${PORT}`);
        });
    }
    catch (error) {
        console.log(error);
        process.exit(1);
    }
};
startServer();
