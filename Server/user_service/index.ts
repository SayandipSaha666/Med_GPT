import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { connectDB } from "./src/lib/prisma";
import { authMiddleware } from "./src/middleware/auth.middleware";
import { transactionController } from "./src/controllers/transactionController";
import userRouter from "./src/routes/user.routes";
import chatRouter from "./src/routes/chat.routes";
import fileRouter from "./src/routes/file.route"
import billingRouter from "./src/routes/billing.routes";
import { env } from "./config/env"

const app = express();

const allowedOrigins = env.FRONTEND_ALLOWED_ORIGINS;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes("*")) {
        callback(null, true);
      } else if (allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Razorpay webhook route — mounted BEFORE express.json() to receive raw body
// for HMAC signature verification. Does NOT use authMiddleware (server-to-server).
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), transactionController.handleWebhook);

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());

const PORT = env.USER_SERVICE_PORT;

// Mount routers
app.use("/api/user", userRouter);
app.use("/api/files", fileRouter)
app.use("/api/chat", authMiddleware, chatRouter);
app.use("/api/billing", authMiddleware, billingRouter);

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
    await connectDB();
    app.listen(PORT, () => {
      console.log(`User service running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

startServer();
