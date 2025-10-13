import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface CreatePoliceOfficerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  designation: string;
  badgeNo: string;
  rank: string;
  joiningDate: Date;
  stationId?: string;
  specialization?: string;
  presentAddress?: string;
  presentCity?: string;
  presentDistrict?: string;
}

export class PoliceManagementService {
  /**
   * Create a new police officer (only by admin/headquarters)
   */
  static async createPoliceOfficer(
    data: CreatePoliceOfficerData,
    createdBy: string
  ) {
    // Check if badge number already exists
    const existingBadge = await prisma.user.findUnique({
      where: { badgeNo: data.badgeNo },
    });

    if (existingBadge) {
      throw new Error("Badge number already exists");
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Create police officer
    const officer = await prisma.user.create({
      data: {
        ...data,
        role: "POLICE",
        isEmailVerified: true, // Auto-verify for police officers created by admin
      },
    });

    // Initialize citizen gem record (police can also drive)
    await prisma.citizenGem.create({
      data: {
        citizenId: officer.id,
        amount: 20, // Police officers start with more gems
      },
    });

    return officer;
  }

  /**
   * Assign police officer to station
   */
  static async assignToStation(
    officerId: string,
    stationId: string,
    assignedBy: string
  ) {
    // Verify the station exists
    const station = await prisma.policeStation.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      throw new Error("Police station not found");
    }

    return await prisma.user.update({
      where: { id: officerId },
      data: { stationId },
    });
  }

  /**
   * Promote/demote police officer
   */
  static async updateRank(
    officerId: string,
    newRank: string,
    promotedBy: string
  ) {
    return await prisma.user.update({
      where: { id: officerId },
      data: {
        rank: newRank,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Set Officer in Charge (OC) for a station
   */
  static async setStationOC(
    stationId: string,
    officerId: string,
    appointedBy: string
  ) {
    // Verify officer exists and is police
    const officer = await prisma.user.findFirst({
      where: {
        id: officerId,
        role: "POLICE",
        isDeleted: false,
        isBlocked: false,
      },
    });

    if (!officer) {
      throw new Error("Police officer not found or invalid");
    }

    return await prisma.policeStation.update({
      where: { id: stationId },
      data: { officerInChargeId: officerId },
    });
  }

  /**
   * Get police officers by station
   */
  static async getOfficersByStation(stationId: string) {
    return await prisma.user.findMany({
      where: {
        stationId,
        role: "POLICE",
        isDeleted: false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        badgeNo: true,
        rank: true,
        designation: true,
        joiningDate: true,
        specialization: true,
        createdAt: true,
      },
      orderBy: [{ rank: "asc" }, { joiningDate: "asc" }],
    });
  }

  /**
   * Get police hierarchy for a station
   */
  static async getStationHierarchy(stationId: string) {
    const station = await prisma.policeStation.findUnique({
      where: { id: stationId },
      include: {
        officerInCharge: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNo: true,
            rank: true,
          },
        },
        users: {
          where: { isDeleted: false },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            badgeNo: true,
            rank: true,
            designation: true,
            specialization: true,
          },
          orderBy: [{ rank: "asc" }, { joiningDate: "asc" }],
        },
      },
    });

    return station;
  }

  /**
   * Search police officers
   */
  static async searchOfficers(query: {
    name?: string;
    badgeNo?: string;
    rank?: string;
    stationId?: string;
    page?: number;
    limit?: number;
  }) {
    const { name, badgeNo, rank, stationId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      role: "POLICE",
      isDeleted: false,
    };

    if (name) {
      where.OR = [
        { firstName: { contains: name, mode: "insensitive" } },
        { lastName: { contains: name, mode: "insensitive" } },
      ];
    }

    if (badgeNo) {
      where.badgeNo = { contains: badgeNo };
    }

    if (rank) {
      where.rank = rank;
    }

    if (stationId) {
      where.stationId = stationId;
    }

    const [officers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          badgeNo: true,
          rank: true,
          designation: true,
          joiningDate: true,
          station: {
            select: {
              name: true,
              code: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { lastName: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      officers,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get police statistics
   */
  static async getPoliceStatistics() {
    const [totalOfficers, officersByRank, officersByStation, recentJoinings] =
      await Promise.all([
        prisma.user.count({
          where: { role: "POLICE", isDeleted: false },
        }),
        prisma.user.groupBy({
          by: ["rank"],
          where: { role: "POLICE", isDeleted: false },
          _count: { rank: true },
        }),
        prisma.user.groupBy({
          by: ["stationId"],
          where: {
            role: "POLICE",
            isDeleted: false,
            stationId: { not: null },
          },
          _count: { stationId: true },
        }),
        prisma.user.count({
          where: {
            role: "POLICE",
            isDeleted: false,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

    return {
      totalOfficers,
      officersByRank,
      officersByStation,
      recentJoinings,
    };
  }

  /**
   * Create police station (by headquarters)
   */
  static async createPoliceStation(data: {
    name: string;
    code: string;
    stationType?: string;
    organizationId?: string;
    locationData?: {
      latitude: number;
      longitude: number;
      address: string;
      city?: string;
      district?: string;
      division?: string;
    };
    contactData?: {
      phone?: string;
      email?: string;
      emergencyPhone?: string;
    };
    capacity?: number;
  }) {
    // Check if station code already exists
    const existingStation = await prisma.policeStation.findUnique({
      where: { code: data.code },
    });

    if (existingStation) {
      throw new Error("Station code already exists");
    }

    // Create location if provided
    let locationId = null;
    if (data.locationData) {
      const location = await prisma.location.create({
        data: {
          ...data.locationData,
          type: "POLICE_STATION",
        },
      });
      locationId = location.id;
    }

    // Create contact info if provided
    let contactId = null;
    if (data.contactData) {
      const contact = await prisma.contactInfo.create({
        data: data.contactData,
      });
      contactId = contact.id;
    }

    return await prisma.policeStation.create({
      data: {
        name: data.name,
        code: data.code,
        stationType: data.stationType,
        organizationId: data.organizationId,
        locationId,
        contactId,
        capacity: data.capacity,
      },
      include: {
        location: true,
        contact: true,
        organization: true,
      },
    });
  }

  /**
   * Transfer officer between stations
   */
  static async transferOfficer(
    officerId: string,
    fromStationId: string,
    toStationId: string,
    transferredBy: string,
    transferReason?: string
  ) {
    return await prisma.user.update({
      where: { id: officerId },
      data: {
        stationId: toStationId,
        updatedAt: new Date(),
      },
    });
  }
}
