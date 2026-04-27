import express from "express";
import { connectDB } from "./src/lib/prisma.js";
import "dotenv/config";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

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