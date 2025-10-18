"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FireTeamService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class FireTeamService {
    static async getAllTeamMembers() {
        const members = await prisma.fireTeamMember.findMany({
            include: { user: true, fireService: true },
        });
        return { members, total: members.length };
    }
    static async getAvailableMembers() {
        return prisma.fireTeamMember.findMany({
            where: { status: "AVAILABLE" },
            include: { user: true },
        });
    }
    static async getTeamMemberById(id) {
        return prisma.fireTeamMember.findUnique({
            where: { id },
            include: { user: true, fireService: true },
        });
    }
    static async updateMemberStatus(id, status) {
        return prisma.fireTeamMember.update({
            where: { id },
            data: { status: status },
        });
    }
    static async getTeamStatistics() {
        const total = await prisma.fireTeamMember.count();
        const available = await prisma.fireTeamMember.count({
            where: { status: "AVAILABLE" },
        });
        return { total, available, onDuty: 0, offDuty: 0 };
    }
}
exports.FireTeamService = FireTeamService;
