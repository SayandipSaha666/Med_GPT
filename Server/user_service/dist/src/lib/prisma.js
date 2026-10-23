"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.prisma = void 0;
const prisma_client_1 = require("../generated/prisma-client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const env_1 = require("../../config/env");
const connectionString = new URL(env_1.env.DATABASE_URL).toString();
const adapter = new adapter_pg_1.PrismaPg({ connectionString });
exports.prisma = new prisma_client_1.PrismaClient({ adapter });
const connectDB = async () => {
    try {
        await exports.prisma.$connect();
        console.log("Database connected");
    }
    catch (error) {
        console.log(error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
exports.default = { prisma: exports.prisma, connectDB: exports.connectDB };
