import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class FireIncidentService {
  static async createIncident(data: any) {
    const incident = await prisma.fireIncident.create({
      data: {
        incidentNumber: `FI-${Date.now()}`,
        type: data.type,
        severity: data.severity,
        description: data.description,
        address: data.address,
        coordinates: data.coordinates,
        reporterUserId: data.reporterUserId,
        reportedBy: data.reportedBy,
        reporterPhone: data.reporterPhone,
      },
      include: { reporterUser: true, location: true },
    });

    // Notify fire service users
    const fireServiceUsers = await prisma.user.findMany({
      where: { role: "FIRE_SERVICE" },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: fireServiceUsers.map((u) => ({
        userId: u.id,
        type: "FIRE_INCIDENT_REPORTED",
        title: `🚨 Fire Emergency`,
        message: `${data.severity} fire at ${data.address}`,
        priority: "URGENT",
      })),
    });

    return incident;
  }

  static async getAllIncidents(filters?: any) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;

    const incidents = await prisma.fireIncident.findMany({
      where,
      include: { reporterUser: true, location: true },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 50,
    });

    return { incidents, total: incidents.length };
  }

  static async getIncidentById(id: string) {
    return prisma.fireIncident.findUnique({
      where: { id },
      include: { reporterUser: true, location: true },
    });
  }

  static async updateIncidentStatus(id: string, status: string) {
    return prisma.fireIncident.update({
      where: { id },
      data: { status: status as any },
    });
  }

  static async getStatistics() {
    const total = await prisma.fireIncident.count();
    const active = await prisma.fireIncident.count({
      where: { status: { in: ["REPORTED", "DISPATCHED", "IN_PROGRESS"] } },
    });

    return { total, active, resolved: 0, critical: 0 };
  }
}
