import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class FireTeamService {
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

  static async getTeamMemberById(id: string) {
    return prisma.fireTeamMember.findUnique({
      where: { id },
      include: { user: true, fireService: true },
    });
  }

  static async updateMemberStatus(id: string, status: string) {
    return prisma.fireTeamMember.update({
      where: { id },
      data: { status: status as any },
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
