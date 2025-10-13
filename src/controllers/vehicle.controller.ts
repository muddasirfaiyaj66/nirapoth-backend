import { Request, Response } from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import { AuthenticatedRequest } from "../types/auth";

const prisma = new PrismaClient();

export class VehicleController {
  // Get all vehicles (Admin/Police only)
  static async getAllVehicles(req: AuthenticatedRequest, res: Response) {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: {
          isActive: true,
          isDeleted: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignments: {
            where: {
              isActive: true,
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
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vehicles",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get user's vehicles
  static async getMyVehicles(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      const vehicles = await prisma.vehicle.findMany({
        where: {
          ownerId: userId,
          isActive: true,
          isDeleted: false,
        },
        include: {
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignments: {
            where: {
              isActive: true,
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
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      console.error("Error fetching user vehicles:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch your vehicles",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get vehicle by ID
  static async getVehicleById(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      const vehicle = await prisma.vehicle.findUnique({
        where: {
          id: vehicleId,
          isDeleted: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignments: {
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
          },
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Check if user has access to this vehicle
      const hasAccess =
        userRole === UserRole.ADMIN ||
        userRole === UserRole.POLICE ||
        vehicle.ownerId === userId ||
        vehicle.driverId === userId ||
        vehicle.assignments.some(
          (assignment) => assignment.citizenId === userId
        );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vehicle",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Add new vehicle
  static async addVehicle(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        plateNo,
        registrationNo,
        engineNo,
        chassisNo,
        brand,
        model,
        year,
        color,
        type,
        expiresAt,
      } = req.body;

      // Validate required fields
      if (
        !plateNo ||
        !engineNo ||
        !chassisNo ||
        !brand ||
        !model ||
        !year ||
        !type
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: plateNo, engineNo, chassisNo, brand, model, year, type",
        });
      }

      // Check for duplicate registration, engine, or chassis numbers
      const existingVehicle = await prisma.vehicle.findFirst({
        where: {
          OR: [
            { plateNo },
            { engineNo },
            { chassisNo },
            ...(registrationNo ? [{ registrationNo }] : []),
          ],
          isDeleted: false,
        },
      });

      if (existingVehicle) {
        let duplicateField = "";
        if (existingVehicle.plateNo === plateNo)
          duplicateField = "plate number";
        else if (existingVehicle.engineNo === engineNo)
          duplicateField = "engine number";
        else if (existingVehicle.chassisNo === chassisNo)
          duplicateField = "chassis number";
        else if (existingVehicle.registrationNo === registrationNo)
          duplicateField = "registration number";

        return res.status(409).json({
          success: false,
          message: `Vehicle with this ${duplicateField} already exists`,
        });
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          plateNo,
          registrationNo: registrationNo || null,
          engineNo,
          chassisNo,
          brand,
          model,
          year: parseInt(year),
          color: color || null,
          type,
          ownerId: userId!,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
          isDeleted: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Vehicle added successfully",
        data: vehicle,
      });
    } catch (error) {
      console.error("Error adding vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add vehicle",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Update vehicle
  static async updateVehicle(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const updateData = req.body;

      // Find the vehicle
      const vehicle = await prisma.vehicle.findUnique({
        where: {
          id: vehicleId,
          isDeleted: false,
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Check if user has permission to update
      const canUpdate =
        userRole === UserRole.ADMIN || vehicle.ownerId === userId;

      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check for duplicate numbers if they're being updated
      if (
        updateData.plateNo ||
        updateData.registrationNo ||
        updateData.engineNo ||
        updateData.chassisNo
      ) {
        const conditions = [];
        if (updateData.plateNo)
          conditions.push({ plateNo: updateData.plateNo });
        if (updateData.registrationNo)
          conditions.push({ registrationNo: updateData.registrationNo });
        if (updateData.engineNo)
          conditions.push({ engineNo: updateData.engineNo });
        if (updateData.chassisNo)
          conditions.push({ chassisNo: updateData.chassisNo });

        const existingVehicle = await prisma.vehicle.findFirst({
          where: {
            AND: [
              { id: { not: vehicleId } },
              { isDeleted: false },
              { OR: conditions },
            ],
          },
        });

        if (existingVehicle) {
          let duplicateField = "";
          if (existingVehicle.plateNo === updateData.plateNo)
            duplicateField = "plate number";
          else if (existingVehicle.registrationNo === updateData.registrationNo)
            duplicateField = "registration number";
          else if (existingVehicle.engineNo === updateData.engineNo)
            duplicateField = "engine number";
          else if (existingVehicle.chassisNo === updateData.chassisNo)
            duplicateField = "chassis number";

          return res.status(409).json({
            success: false,
            message: `Vehicle with this ${duplicateField} already exists`,
          });
        }
      }

      const updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          ...updateData,
          year: updateData.year ? parseInt(updateData.year) : undefined,
          expiresAt: updateData.expiresAt
            ? new Date(updateData.expiresAt)
            : undefined,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: "Vehicle updated successfully",
        data: updatedVehicle,
      });
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update vehicle",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Delete vehicle
  static async deleteVehicle(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      // Find the vehicle
      const vehicle = await prisma.vehicle.findUnique({
        where: {
          id: vehicleId,
          isDeleted: false,
        },
        include: {
          assignments: {
            where: {
              isActive: true,
            },
          },
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Check if user has permission to delete
      const canDelete =
        userRole === UserRole.ADMIN || vehicle.ownerId === userId;

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check if vehicle has active assignments
      if (vehicle.assignments && vehicle.assignments.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete vehicle with active assignments",
        });
      }

      // Soft delete - set isDeleted to true
      await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          isDeleted: true,
          isActive: false,
        },
      });

      res.json({
        success: true,
        message: "Vehicle deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete vehicle",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get vehicle assignment history
  static async getVehicleHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      // Find the vehicle
      const vehicle = await prisma.vehicle.findUnique({
        where: {
          id: vehicleId,
          isDeleted: false,
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Check access
      const hasAccess =
        userRole === UserRole.ADMIN ||
        userRole === UserRole.POLICE ||
        vehicle.ownerId === userId;

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const assignments = await prisma.vehicleAssignment.findMany({
        where: { vehicleId },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          drivingLicense: {
            select: {
              id: true,
              licenseNo: true,
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      console.error("Error fetching vehicle history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vehicle history",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Assign self as driver
  static async assignSelfAsDriver(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId } = req.params;
      const userId = req.user?.userId;
      const { drivingLicenseId, notes, validUntil } = req.body;

      // Validate required fields
      if (!drivingLicenseId) {
        return res.status(400).json({
          success: false,
          message: "Driving license ID is required",
        });
      }

      // Find the vehicle
      const vehicle = await prisma.vehicle.findUnique({
        where: {
          id: vehicleId,
          isDeleted: false,
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      // Check if vehicle is available
      const activeAssignment = await prisma.vehicleAssignment.findFirst({
        where: {
          vehicleId,
          isActive: true,
        },
      });

      if (activeAssignment && activeAssignment.citizenId !== userId) {
        return res.status(400).json({
          success: false,
          message: "Vehicle is already assigned to another driver",
        });
      }

      if (activeAssignment && activeAssignment.citizenId === userId) {
        return res.status(400).json({
          success: false,
          message: "You are already assigned to this vehicle",
        });
      }

      // Verify driving license
      const license = await prisma.drivingLicense.findFirst({
        where: {
          id: drivingLicenseId,
          citizenId: userId!,
          isActive: true,
          isVerified: true,
          expiryDate: {
            gt: new Date(),
          },
        },
      });

      if (!license) {
        return res.status(400).json({
          success: false,
          message: "Valid driving license not found or expired",
        });
      }

      // Create vehicle assignment
      const assignment = await prisma.vehicleAssignment.create({
        data: {
          vehicleId,
          citizenId: userId!,
          assignedBy: userId!, // Self-assignment
          drivingLicenseId,
          notes: notes || null,
          validUntil: validUntil ? new Date(validUntil) : null,
          isActive: true,
          isApproved: true, // Auto-approve self-assignments for now
          requiresApproval: false,
        },
        include: {
          vehicle: {
            select: {
              plateNo: true,
              brand: true,
              model: true,
            },
          },
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          drivingLicense: {
            select: {
              licenseNo: true,
              category: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        data: assignment,
      });
    } catch (error) {
      console.error("Error creating self assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create assignment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Search vehicles
  static async searchVehicles(req: AuthenticatedRequest, res: Response) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const vehicles = await prisma.vehicle.findMany({
        where: {
          AND: [
            { isDeleted: false },
            {
              OR: [
                { plateNo: { contains: query as string, mode: "insensitive" } },
                {
                  registrationNo: {
                    contains: query as string,
                    mode: "insensitive",
                  },
                },
                {
                  engineNo: { contains: query as string, mode: "insensitive" },
                },
                {
                  chassisNo: { contains: query as string, mode: "insensitive" },
                },
                { brand: { contains: query as string, mode: "insensitive" } },
                { model: { contains: query as string, mode: "insensitive" } },
              ],
            },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignments: {
            where: {
              isActive: true,
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
          },
        },
        take: 20, // Limit results
      });

      res.json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      console.error("Error searching vehicles:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search vehicles",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
