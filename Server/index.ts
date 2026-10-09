require("dotenv").config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { connectDB } from "./src/lib/prisma";
import { authMiddleware } from "./src/middleware/authMiddleware";
import { transactionController } from "./src/controllers/transactionController";
import userRouter from "./src/routes/user.routes";
import chatRouter from "./src/routes/chat.routes";
import billingRouter from "./src/routes/billing.routes";

const app = express();

const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

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

const PORT = process.env.PORT || 3000;

// Mount routers
app.use("/api/user", userRouter);
app.use("/api/chat", authMiddleware, chatRouter);
app.use("/api/billing", authMiddleware, billingRouter);

// Health check route (for Render monitoring)
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
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
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

startServer();
