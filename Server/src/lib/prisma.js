import { PrismaClient } from "../generated/prisma-client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Database connected");
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

export { prisma, connectDB };