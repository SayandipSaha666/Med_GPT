import { PrismaClient } from "../generated/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = new URL(process.env.DATABASE_URL!).toString();
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default { prisma, connectDB };
