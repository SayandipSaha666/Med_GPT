require("dotenv").config();
const express = require("express");
const cors = require('cors')
const cookieParser = require("cookie-parser");
const bodyparser = require('body-parser')
const { connectDB } = require("./src/lib/prisma.js");
const { authMiddleware } = require("./src/middleware/authMiddleware");
const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];
app.use(cors({
    origin: allowedOrigins,
    methods: ['GET','POST','PUT','DELETE'],
    credentials: true
}))

// Razorpay webhook route — mounted BEFORE express.json() to receive raw body
// for HMAC signature verification. Does NOT use authMiddleware (server-to-server).
const { handleWebhook } = require('./src/controllers/transactionController');
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json());
app.use(cookieParser());
app.use(bodyparser.json())

const PORT = process.env.PORT || 3000;

const userRouter = require('./src/routes/userRoutes');
app.use('/api/user',userRouter)

const chatRouter = require('./src/routes/chatRoutes');
app.use('/api/chat', authMiddleware, chatRouter)

const billingRouter = require('./src/routes/billingRoutes');
app.use('/api/billing', authMiddleware, billingRouter)

// Health check route (for Render monitoring)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use('/api', (req, res) => {
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
}

startServer();