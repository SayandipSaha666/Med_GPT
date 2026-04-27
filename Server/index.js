const express = require("express");
const { connectDB } = require("./src/lib/prisma.js");
require("dotenv").config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const userRouter = require('./src/routes/userRoutes');
app.use('/api/user',userRouter)

const chatRouter = require('./src/routes/chatRoutes');
app.use('/api/chat',chatRouter)

app.use('/api',(req,res) => {
    res.status(200).json({message: "Hello Express"});
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