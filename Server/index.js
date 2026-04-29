require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./src/lib/prisma.js");
const { authMiddleware } = require("./src/middleware/authMiddleware");
const app = express();

// Razorpay webhook route — mounted BEFORE express.json() to receive raw body
// for HMAC signature verification. Does NOT use authMiddleware (server-to-server).
const { handleWebhook } = require('./src/controllers/transactionController');
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

const userRouter = require('./src/routes/userRoutes');
app.use('/api/user',userRouter)

const chatRouter = require('./src/routes/chatRoutes');
app.use('/api/chat', authMiddleware, chatRouter)

const billingRouter = require('./src/routes/billingRoutes');
app.use('/api/billing', authMiddleware, billingRouter)

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