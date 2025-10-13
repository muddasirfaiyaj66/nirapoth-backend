import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class DrivingLicenseService {
  /**
   * Create a new driving license for a citizen
   */
  static async createDrivingLicense(data: {
    licenseNo: string;
    citizenId: string;
    category:
      | "LIGHT_VEHICLE"
      | "MOTORCYCLE"
      | "LIGHT_VEHICLE_MOTORCYCLE"
      | "HEAVY_VEHICLE"
      | "PSV"
      | "GOODS_VEHICLE";
    issueDate: Date;
    expiryDate: Date;
    issuingAuthority: string;
    restrictions?: string[];
    endorsements?: string[];
  }) {
    return await prisma.drivingLicense.create({
      data: {
        ...data,
        restrictions: data.restrictions
          ? JSON.stringify(data.restrictions)
          : null,
        endorsements: data.endorsements
          ? JSON.stringify(data.endorsements)
          : null,
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Verify a driving license
   */
  static async verifyLicense(licenseId: string, verifiedBy: string) {
    return await prisma.drivingLicense.update({
      where: { id: licenseId },
      data: {
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });
  }

  /**
   * Check if citizen has valid driving license for vehicle category
   */
  static async hasValidLicense(
    citizenId: string,
    vehicleCategory?:
      | "LIGHT_VEHICLE"
      | "MOTORCYCLE"
      | "LIGHT_VEHICLE_MOTORCYCLE"
      | "HEAVY_VEHICLE"
      | "PSV"
      | "GOODS_VEHICLE"
  ): Promise<boolean> {
    const now = new Date();

    const license = await prisma.drivingLicense.findFirst({
      where: {
        citizenId,
        isActive: true,
        isVerified: true,
        isSuspended: false,
        expiryDate: { gt: now },
        ...(vehicleCategory && { category: vehicleCategory }),
      },
    });

    return !!license;
  }

  /**
   * Get citizen's active driving licenses
   */
  static async getCitizenLicenses(citizenId: string) {
    return await prisma.drivingLicense.findMany({
      where: {
        citizenId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      include: {
        citizen: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Suspend a driving license
   */
  static async suspendLicense(
    licenseId: string,
    suspendedUntil: Date,
    reason: string
  ) {
    return await prisma.drivingLicense.update({
      where: { id: licenseId },
      data: {
        isSuspended: true,
        suspendedUntil,
        suspensionReason: reason,
      },
    });
  }

  /**
   * Update license violation count
   */
  static async recordViolation(licenseNo: string) {
    const license = await prisma.drivingLicense.findUnique({
      where: { licenseNo },
    });

    if (!license) return null;

    return await prisma.drivingLicense.update({
      where: { licenseNo },
      data: {
        violationCount: license.violationCount + 1,
        lastViolationAt: new Date(),
      },
    });
  }

  /**
   * Get licenses expiring soon (within 30 days)
   */
  static async getLicensesExpiringSoon(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await prisma.drivingLicense.findMany({
      where: {
        isActive: true,
        expiryDate: {
          lte: futureDate,
          gt: new Date(),
        },
      },
      include: {
        citizen: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { expiryDate: "asc" },
    });
  }

  /**
   * Validate license for vehicle assignment
   */
  static async validateForVehicleAssignment(
    citizenId: string,
    vehicleType: string
  ) {
    // Map vehicle types to license categories
    const categoryMapping: {
      [key: string]: (
        | "LIGHT_VEHICLE"
        | "MOTORCYCLE"
        | "LIGHT_VEHICLE_MOTORCYCLE"
        | "HEAVY_VEHICLE"
        | "PSV"
        | "GOODS_VEHICLE"
      )[];
    } = {
      MOTORCYCLE: ["MOTORCYCLE", "LIGHT_VEHICLE_MOTORCYCLE"],
      CAR: ["LIGHT_VEHICLE", "LIGHT_VEHICLE_MOTORCYCLE"],
      TRUCK: ["HEAVY_VEHICLE", "GOODS_VEHICLE"],
      BUS: ["HEAVY_VEHICLE", "PSV"],
    };

    const requiredCategories = categoryMapping[vehicleType] || [
      "LIGHT_VEHICLE",
    ];

    const validLicense = await prisma.drivingLicense.findFirst({
      where: {
        citizenId,
        category: { in: requiredCategories },
        isActive: true,
        isVerified: true,
        isSuspended: false,
        expiryDate: { gt: new Date() },
      },
    });

    return {
      isValid: !!validLicense,
      license: validLicense,
      requiredCategories,
    };
  }

  /**
   * Get all licenses for admin management
   */
  static async getAllLicenses(filters: {
    page?: number;
    limit?: number;
    category?: string;
    isVerified?: boolean;
    isExpired?: boolean;
  }) {
    const { page = 1, limit = 20, category, isVerified, isExpired } = filters;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {};

    if (category) where.category = category;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (isExpired !== undefined) {
      where.expiryDate = isExpired ? { lt: now } : { gte: now };
    }

    const [licenses, total] = await Promise.all([
      prisma.drivingLicense.findMany({
        where,
        skip,
        take: limit,
        include: {
          citizen: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.drivingLicense.count({ where }),
    ]);

    return {
      licenses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
