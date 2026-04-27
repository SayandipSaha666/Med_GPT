const { PrismaClient } = require("../generated/prisma-client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = new URL(process.env.DATABASE_URL).toString();
const adapter = new PrismaPg({ connectionString });
// const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
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

module.exports = { prisma, connectDB };