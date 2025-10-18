import { PrismaClient, ViolationSeverity, ViolationType } from "@prisma/client";

const prisma = new PrismaClient();

// Gem deduction amounts based on severity (Max gem balance is 10)
const GEM_DEDUCTION_RATES = {
  MINOR: 1, // Small violations: parking, seatbelt
  MODERATE: 2, // Standard violations: speeding, signal breaking
  SERIOUS: 3, // Dangerous: wrong side, reckless driving
  SEVERE: 5, // Very dangerous: drunk driving, no license
  CRITICAL: 10, // Life-threatening: causes accident, fleeing scene
};

export class GemPenaltyService {
  /**
   * Apply gem penalty to a citizen for a violation
   */
  static async applyPenalty(data: {
    citizenId: string;
    amount: number;
    reason: string;
    violationType?: ViolationType;
    severity: ViolationSeverity;
    violationId?: string;
    licenseNo?: string;
    appliedBy: string;
    notes?: string;
  }): Promise<any> {
    try {
      // Check if citizen exists
      const citizen = await prisma.user.findUnique({
        where: { id: data.citizenId },
        include: { citizenGem: true },
      });

      if (!citizen) {
        throw new Error("Citizen not found");
      }

      // Check if citizen gem record exists, create if not
      let citizenGem = citizen.citizenGem;
      if (!citizenGem) {
        citizenGem = await prisma.citizenGem.create({
          data: {
            citizenId: data.citizenId,
            amount: 0,
          },
        });
      }

      // Calculate new gem amount (cannot go below 0)
      const newGemAmount = Math.max(0, citizenGem.amount - data.amount);

      // Start transaction to update gem and create penalty record
      const result = await prisma.$transaction(async (tx) => {
        // Create gem penalty record
        const penalty = await tx.gemPenalty.create({
          data: {
            citizenId: data.citizenId,
            amount: data.amount,
            reason: data.reason,
            violationType: data.violationType,
            severity: data.severity,
            violationId: data.violationId,
            licenseNo: data.licenseNo,
            appliedBy: data.appliedBy,
            notes: data.notes,
          },
          include: {
            citizen: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            officer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                designation: true,
              },
            },
          },
        });

        // Update citizen gem amount
        await tx.citizenGem.update({
          where: { citizenId: data.citizenId },
          data: {
            amount: newGemAmount,
            lastUpdated: new Date(),
          },
        });

        return penalty;
      });

      return result;
    } catch (error) {
      console.error("Error applying gem penalty:", error);
      throw error;
    }
  }

  /**
   * Search driver by license number
   */
  static async searchByLicense(licenseNo: string): Promise<any> {
    try {
      const license = await prisma.drivingLicense.findUnique({
        where: { licenseNo },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              nidNo: true,
              profileImage: true,
              dateOfBirth: true,
              bloodGroup: true,
            },
          },
        },
      });

      if (!license) {
        return null;
      }

      // Get citizen's gem balance
      const citizenGem = await prisma.citizenGem.findUnique({
        where: { citizenId: license.citizen.id },
      });

      // Get violation history
      const violations = await prisma.violation.findMany({
        where: {
          vehicle: {
            ownerId: license.citizen.id,
          },
        },
        include: {
          rule: true,
          fine: true,
          vehicle: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Get gem penalty history
      const gemPenalties = await prisma.gemPenalty.findMany({
        where: { citizenId: license.citizen.id },
        include: {
          officer: {
            select: {
              firstName: true,
              lastName: true,
              designation: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return {
        license,
        citizen: license.citizen,
        gemBalance: citizenGem?.amount || 0,
        isRestricted: citizenGem?.isRestricted || false,
        violations,
        gemPenalties,
      };
    } catch (error) {
      console.error("Error searching driver by license:", error);
      throw error;
    }
  }

  /**
   * Get gem penalty history for a citizen
   */
  static async getPenaltyHistory(
    citizenId: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<any> {
    try {
      const penalties = await prisma.gemPenalty.findMany({
        where: { citizenId },
        include: {
          officer: {
            select: {
              firstName: true,
              lastName: true,
              designation: true,
            },
          },
          violation: {
            include: {
              rule: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });

      const total = await prisma.gemPenalty.count({
        where: { citizenId },
      });

      return {
        penalties,
        total,
        hasMore: total > skip + limit,
      };
    } catch (error) {
      console.error("Error fetching gem penalty history:", error);
      throw error;
    }
  }

  /**
   * Calculate recommended gem deduction based on severity
   */
  static getRecommendedDeduction(severity: ViolationSeverity): number {
    return GEM_DEDUCTION_RATES[severity] || GEM_DEDUCTION_RATES.MODERATE;
  }

  /**
   * Get all gem penalties (for police/admin)
   */
  static async getAllPenalties(
    filters?: {
      citizenId?: string;
      appliedBy?: string;
      severity?: ViolationSeverity;
      dateFrom?: Date;
      dateTo?: Date;
    },
    limit: number = 50,
    skip: number = 0
  ): Promise<any> {
    try {
      const where: any = {};

      if (filters?.citizenId) where.citizenId = filters.citizenId;
      if (filters?.appliedBy) where.appliedBy = filters.appliedBy;
      if (filters?.severity) where.severity = filters.severity;
      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) where.createdAt.lte = filters.dateTo;
      }

      const penalties = await prisma.gemPenalty.findMany({
        where,
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          officer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              designation: true,
            },
          },
          violation: {
            include: {
              rule: true,
              vehicle: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });

      const total = await prisma.gemPenalty.count({ where });

      return {
        penalties,
        total,
        hasMore: total > skip + limit,
      };
    } catch (error) {
      console.error("Error fetching all penalties:", error);
      throw error;
    }
  }

  /**
   * Get gem penalty statistics
   */
  static async getStatistics(officerId?: string): Promise<any> {
    try {
      const where: any = officerId ? { appliedBy: officerId } : {};

      const totalPenalties = await prisma.gemPenalty.count({ where });
      const totalGemsDeducted = await prisma.gemPenalty.aggregate({
        where,
        _sum: {
          amount: true,
        },
      });

      const penaltiesBySeverity = await prisma.gemPenalty.groupBy({
        by: ["severity"],
        where,
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });

      const recentPenalties = await prisma.gemPenalty.findMany({
        where,
        include: {
          citizen: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      return {
        totalPenalties,
        totalGemsDeducted: totalGemsDeducted._sum.amount || 0,
        penaltiesBySeverity,
        recentPenalties,
      };
    } catch (error) {
      console.error("Error fetching gem penalty statistics:", error);
      throw error;
    }
  }
}
