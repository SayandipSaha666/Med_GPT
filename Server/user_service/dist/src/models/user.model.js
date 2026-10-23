"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = exports.UserModel = void 0;
// User model
const prisma_1 = require("../lib/prisma");
class UserModel {
    async findById(id) {
        return prisma_1.prisma.user.findUnique({ where: { id } });
    }
    async findByEmail(email) {
        return prisma_1.prisma.user.findUnique({ where: { email } });
    }
    async create(data) {
        return prisma_1.prisma.user.create({ data });
    }
    async update(id, data) {
        return prisma_1.prisma.user.update({ where: { id }, data });
    }
    async incrementCredits(id, amount) {
        return prisma_1.prisma.user.update({
            where: { id },
            data: { credits: { increment: amount } },
        });
    }
}
exports.UserModel = UserModel;
exports.userModel = new UserModel();
