import { PrismaClient } from "@prisma/client";
import { DrivingLicenseService } from "./drivingLicense.service";

const prisma = new PrismaClient();

export class VehicleAssignmentService {
  /**
   * Assign a citizen as driver to a vehicle with license validation
   */
  static async assignDriver(data: {
    vehicleId: string;
    citizenId: string;
    assignedBy: string;
    validFrom?: Date;
    validUntil?: Date;
    notes?: string;
    requiresApproval?: boolean;
  }) {
    // Get vehicle details to check type
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    // Validate driving license
    const licenseValidation =
      await DrivingLicenseService.validateForVehicleAssignment(
        data.citizenId,
        vehicle.type
      );

    if (!licenseValidation.isValid) {
      throw new Error(
        `Citizen does not have a valid driving license for ${
          vehicle.type
        }. Required categories: ${licenseValidation.requiredCategories.join(
          ", "
        )}`
      );
    }

    // Check if citizen has sufficient gems (not restricted)
    const citizenGem = await prisma.citizenGem.findUnique({
      where: { citizenId: data.citizenId },
    });

    if (citizenGem?.isRestricted) {
      throw new Error(
        "Citizen is restricted from driving due to insufficient gems"
      );
    }

    // Create the assignment
    return await prisma.vehicleAssignment.create({
      data: {
        ...data,
        drivingLicenseId: licenseValidation.license?.id,
        validFrom: data.validFrom || new Date(),
        isApproved: !data.requiresApproval,
      },
      include: {
        vehicle: {
          select: {
            plateNo: true,
            type: true,
            brand: true,
            model: true,
          },
        },
        citizen: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        drivingLicense: {
          select: {
            licenseNo: true,
            category: true,
            expiryDate: true,
          },
        },
      },
    });
  }

  /**
   * Unassign driver from vehicle
   */
  static async unassignDriver(assignmentId: string, unassignedBy: string) {
    return await prisma.vehicleAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        validUntil: new Date(),
        notes: `Unassigned by user ${unassignedBy} on ${new Date().toISOString()}`,
      },
    });
  }

  /**
   * Get vehicle assignments for a citizen
   */
  static async getCitizenAssignments(
    citizenId: string,
    activeOnly: boolean = true
  ) {
    const where: any = { citizenId };
    if (activeOnly) {
      where.isActive = true;
      where.OR = [{ validUntil: null }, { validUntil: { gt: new Date() } }];
    }

    return await prisma.vehicleAssignment.findMany({
      where,
      include: {
        vehicle: {
          select: {
            plateNo: true,
            type: true,
            brand: true,
            model: true,
            owner: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        drivingLicense: {
          select: {
            licenseNo: true,
            category: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  }

  /**
   * Get assignments for a vehicle
   */
  static async getVehicleAssignments(
    vehicleId: string,
    activeOnly: boolean = true
  ) {
    const where: any = { vehicleId };
    if (activeOnly) {
      where.isActive = true;
      where.OR = [{ validUntil: null }, { validUntil: { gt: new Date() } }];
    }

    return await prisma.vehicleAssignment.findMany({
      where,
      include: {
        citizen: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        drivingLicense: {
          select: {
            licenseNo: true,
            category: true,
            expiryDate: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  }

  /**
   * Approve vehicle assignment (for organizations)
   */
  static async approveAssignment(assignmentId: string, approvedBy: string) {
    return await prisma.vehicleAssignment.update({
      where: { id: assignmentId },
      data: {
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Check if citizen can drive a specific vehicle
   */
  static async canDriveVehicle(
    citizenId: string,
    vehicleId: string
  ): Promise<{
    canDrive: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      reasons.push("Vehicle not found");
      return { canDrive: false, reasons };
    }

    // Check if vehicle is active
    if (!vehicle.isActive) {
      reasons.push("Vehicle is not active");
    }

    // Check driving license
    const licenseValidation =
      await DrivingLicenseService.validateForVehicleAssignment(
        citizenId,
        vehicle.type
      );

    if (!licenseValidation.isValid) {
      reasons.push(`No valid driving license for ${vehicle.type}`);
    }

    // Check citizen gems
    const citizenGem = await prisma.citizenGem.findUnique({
      where: { citizenId },
    });

    if (citizenGem?.isRestricted) {
      reasons.push("Citizen is restricted from driving");
    }

    // Check if citizen is assigned to this vehicle
    const assignment = await prisma.vehicleAssignment.findFirst({
      where: {
        vehicleId,
        citizenId,
        isActive: true,
        isApproved: true,
        OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
      },
    });

    if (!assignment) {
      reasons.push("Citizen is not assigned to drive this vehicle");
    }

    return {
      canDrive: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Get assignments expiring soon
   */
  static async getExpiringAssignments(days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await prisma.vehicleAssignment.findMany({
      where: {
        isActive: true,
        validUntil: {
          lte: futureDate,
          gt: new Date(),
        },
      },
      include: {
        vehicle: {
          select: {
            plateNo: true,
            type: true,
          },
        },
        citizen: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { validUntil: "asc" },
    });
  }
}
