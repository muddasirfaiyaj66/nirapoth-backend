import { prisma } from "../lib/prisma";
import { VehicleType } from "@prisma/client";

export interface CreateVehicleDTO {
  type: VehicleType;
  plateNo: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  engineNo: string;
  chassisNo: string;
  registrationNo?: string;
  registrationDate?: Date;
  ownerId: string;
  expiresAt?: Date;
}

export interface UpdateVehicleDTO {
  type?: VehicleType;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  expiresAt?: Date;
  isActive?: boolean;
}

class VehicleService {
  /**
   * Create a new vehicle
   */
  async createVehicle(data: CreateVehicleDTO) {
    // Check for duplicate plate number
    const existingPlate = await prisma.vehicle.findUnique({
      where: { plateNo: data.plateNo },
    });

    if (existingPlate && !existingPlate.isDeleted) {
      throw new Error("Vehicle with this plate number already exists");
    }

    // Check for duplicate engine number
    const existingEngine = await prisma.vehicle.findUnique({
      where: { engineNo: data.engineNo },
    });

    if (existingEngine && !existingEngine.isDeleted) {
      throw new Error("Vehicle with this engine number already exists");
    }

    // Check for duplicate chassis number
    const existingChassis = await prisma.vehicle.findUnique({
      where: { chassisNo: data.chassisNo },
    });

    if (existingChassis && !existingChassis.isDeleted) {
      throw new Error("Vehicle with this chassis number already exists");
    }

    return await prisma.vehicle.create({
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });
  }

  /**
   * Get all vehicles for a user
   */
  async getVehiclesByUserId(userId: string) {
    return await prisma.vehicle.findMany({
      where: {
        ownerId: userId,
        isDeleted: false,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        violations: {
          where: {
            status: "CONFIRMED",
          },
          include: {
            fine: true,
            rule: {
              select: {
                title: true,
                description: true,
                penalty: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get vehicle by ID
   */
  async getVehicleById(vehicleId: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        violations: {
          include: {
            fine: true,
            rule: {
              select: {
                title: true,
                description: true,
                penalty: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        assignments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!vehicle || vehicle.isDeleted) {
      return null;
    }

    return vehicle;
  }

  /**
   * Get vehicle by plate number
   */
  async getVehicleByPlateNo(plateNo: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { plateNo },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!vehicle || vehicle.isDeleted) {
      return null;
    }

    return vehicle;
  }

  /**
   * Update vehicle information
   */
  async updateVehicle(
    vehicleId: string,
    ownerId: string,
    data: UpdateVehicleDTO
  ) {
    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    if (vehicle.ownerId !== ownerId) {
      throw new Error("You are not authorized to update this vehicle");
    }

    if (vehicle.isDeleted) {
      throw new Error("Vehicle has been deleted");
    }

    return await prisma.vehicle.update({
      where: { id: vehicleId },
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete a vehicle
   */
  async deleteVehicle(vehicleId: string, ownerId: string) {
    // Verify ownership
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    if (vehicle.ownerId !== ownerId) {
      throw new Error("You are not authorized to delete this vehicle");
    }

    return await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStats(vehicleId: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        violations: {
          include: {
            fine: true,
          },
        },
      },
    });

    if (!vehicle || vehicle.isDeleted) {
      throw new Error("Vehicle not found");
    }

    const totalViolations = vehicle.violations.length;
    const pendingViolations = vehicle.violations.filter(
      (v) => v.status === "PENDING"
    ).length;
    const confirmedViolations = vehicle.violations.filter(
      (v) => v.status === "CONFIRMED"
    ).length;

    const totalFines = vehicle.violations.reduce((sum, v) => {
      return sum + (v.fine?.amount || 0);
    }, 0);

    const unpaidFines = vehicle.violations
      .filter((v) => v.fine?.status === "UNPAID")
      .reduce((sum, v) => {
        return sum + (v.fine?.amount || 0);
      }, 0);

    const paidFines = vehicle.violations
      .filter((v) => v.fine?.status === "PAID")
      .reduce((sum, v) => {
        return sum + (v.fine?.amount || 0);
      }, 0);

    return {
      vehicleId: vehicle.id,
      plateNo: vehicle.plateNo,
      totalViolations,
      pendingViolations,
      confirmedViolations,
      totalFines,
      unpaidFines,
      paidFines,
    };
  }

  /**
   * Search vehicles by plate number (for police/admin)
   */
  async searchVehicles(query: string, limit: number = 10) {
    return await prisma.vehicle.findMany({
      where: {
        OR: [
          { plateNo: { contains: query, mode: "insensitive" } },
          { engineNo: { contains: query, mode: "insensitive" } },
          { chassisNo: { contains: query, mode: "insensitive" } },
        ],
        isDeleted: false,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export default new VehicleService();
