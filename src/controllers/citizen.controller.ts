import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../types/auth";

const prisma = new PrismaClient();

export class CitizenController {
  /**
   * Get citizen's vehicles
   * @route GET /api/citizen/vehicles
   */
  static async getMyVehicles(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      const where: any = {
        ownerId: userId,
        isActive: true,
        isDeleted: false,
      };

      if (search) {
        where.OR = [
          { plateNo: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
          { model: { contains: search, mode: "insensitive" } },
        ];
      }

      const [vehicles, total] = await Promise.all([
        prisma.vehicle.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            assignments: {
              where: { isActive: true },
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
        }),
        prisma.vehicle.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          vehicles: vehicles.map((v) => ({
            id: v.id,
            licensePlate: v.plateNo,
            make: v.brand,
            model: v.model,
            year: v.year,
            type: v.type,
            color: v.color || "",
            status: v.isActive ? "active" : "inactive",
            registrationDate: v.registeredAt,
            ownerId: v.ownerId,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user vehicles:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch vehicles",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Register a new vehicle for the citizen
   * @route POST /api/citizen/vehicles
   */
  static async registerVehicle(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { licensePlate, make, model, year, type, color } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      // Check if vehicle with same plate number already exists
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { plateNo: licensePlate },
      });

      if (existingVehicle) {
        res.status(400).json({
          success: false,
          message: "Vehicle with this license plate already exists",
        });
        return;
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          plateNo: licensePlate,
          brand: make,
          model,
          year: parseInt(year),
          type,
          color,
          engineNo: `ENG-${Date.now()}`, // Generate temporary engine number
          chassisNo: `CHS-${Date.now()}`, // Generate temporary chassis number
          ownerId: userId,
          registeredAt: new Date(),
          isActive: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Vehicle registered successfully",
        data: {
          id: vehicle.id,
          licensePlate: vehicle.plateNo,
          make: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          type: vehicle.type,
          color: vehicle.color || "",
          status: "active",
          registrationDate: vehicle.registeredAt,
          ownerId: vehicle.ownerId,
        },
      });
    } catch (error) {
      console.error("Error registering vehicle:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register vehicle",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update citizen's vehicle
   * @route PUT /api/citizen/vehicles/:vehicleId
   */
  static async updateVehicle(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { vehicleId } = req.params;
      const updates = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      // Check if vehicle belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          ownerId: userId,
        },
      });

      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: "Vehicle not found or you don't have permission",
        });
        return;
      }

      const updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          brand: updates.make || vehicle.brand,
          model: updates.model || vehicle.model,
          year: updates.year ? parseInt(updates.year) : vehicle.year,
          color: updates.color || vehicle.color,
          type: updates.type || vehicle.type,
        },
      });

      res.json({
        success: true,
        message: "Vehicle updated successfully",
        data: {
          id: updatedVehicle.id,
          licensePlate: updatedVehicle.plateNo,
          make: updatedVehicle.brand,
          model: updatedVehicle.model,
          year: updatedVehicle.year,
          type: updatedVehicle.type,
          color: updatedVehicle.color || "",
          status: updatedVehicle.isActive ? "active" : "inactive",
          registrationDate: updatedVehicle.registeredAt,
          ownerId: updatedVehicle.ownerId,
        },
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

  /**
   * Delete citizen's vehicle
   * @route DELETE /api/citizen/vehicles/:vehicleId
   */
  static async deleteVehicle(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { vehicleId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      // Check if vehicle belongs to user
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          ownerId: userId,
        },
      });

      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: "Vehicle not found or you don't have permission",
        });
        return;
      }

      // Soft delete
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

  /**
   * Get citizen's violations
   * @route GET /api/citizen/violations
   */
  static async getMyViolations(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      // Get user's vehicles first
      const userVehicles = await prisma.vehicle.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const vehicleIds = userVehicles.map((v) => v.id);

      const where: any = {
        vehicleId: { in: vehicleIds },
      };

      if (status && status !== "all") {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" } },
          {
            vehicle: {
              plateNo: { contains: search, mode: "insensitive" },
            },
          },
        ];
      }

      const [violations, total] = await Promise.all([
        prisma.violation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            rule: true,
            vehicle: {
              select: {
                id: true,
                plateNo: true,
                brand: true,
                model: true,
              },
            },
            location: true,
            fine: true,
          },
        }),
        prisma.violation.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          violations: violations.map((v) => ({
            id: v.id,
            type: v.rule?.title || "Unknown",
            description: v.description || "",
            vehicleId: v.vehicleId,
            vehicle: {
              licensePlate: v.vehicle?.plateNo || "",
            },
            location: v.location
              ? {
                  latitude: v.location.latitude,
                  longitude: v.location.longitude,
                  address: v.location.address || "",
                }
              : { latitude: 0, longitude: 0, address: "" },
            fineAmount: v.fine?.amount || v.rule?.penalty || 0,
            status: v.status.toLowerCase(),
            violationDate: v.createdAt,
            createdAt: v.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user violations:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch violations",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get violation by ID (only if it belongs to user's vehicle)
   * @route GET /api/citizen/violations/:violationId
   */
  static async getViolationById(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { violationId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      // Get user's vehicles
      const userVehicles = await prisma.vehicle.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const vehicleIds = userVehicles.map((v) => v.id);

      const violation = await prisma.violation.findFirst({
        where: {
          id: violationId,
          vehicleId: { in: vehicleIds },
        },
        include: {
          rule: true,
          vehicle: true,
          location: true,
          fine: true,
        },
      });

      if (!violation) {
        res.status(404).json({
          success: false,
          message: "Violation not found",
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: violation.id,
          type: violation.rule?.title || "Unknown",
          description: violation.description || "",
          vehicleId: violation.vehicleId,
          vehicle: {
            licensePlate: violation.vehicle?.plateNo || "",
          },
          location: violation.location
            ? {
                latitude: violation.location.latitude,
                longitude: violation.location.longitude,
                address: violation.location.address || "",
              }
            : { latitude: 0, longitude: 0, address: "" },
          fineAmount: violation.fine?.amount || violation.rule?.penalty || 0,
          status: violation.status.toLowerCase(),
          violationDate: violation.createdAt,
          createdAt: violation.createdAt,
        },
      });
    } catch (error) {
      console.error("Error fetching violation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch violation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Appeal a violation
   * @route POST /api/citizen/violations/:violationId/appeal
   */
  static async appealViolation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { violationId } = req.params;
      const { reason } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      // Get user's vehicles
      const userVehicles = await prisma.vehicle.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const vehicleIds = userVehicles.map((v) => v.id);

      // Check if violation belongs to user's vehicle
      const violation = await prisma.violation.findFirst({
        where: {
          id: violationId,
          vehicleId: { in: vehicleIds },
        },
      });

      if (!violation) {
        res.status(404).json({
          success: false,
          message: "Violation not found",
        });
        return;
      }

      // Update violation status to DISPUTED
      const updatedViolation = await prisma.violation.update({
        where: { id: violationId },
        data: {
          status: "DISPUTED",
          description: `${
            violation.description || ""
          }\n\nAppeal Reason: ${reason}`,
        },
      });

      res.json({
        success: true,
        message: "Violation appeal submitted successfully",
        data: {
          id: updatedViolation.id,
          status: updatedViolation.status,
        },
      });
    } catch (error) {
      console.error("Error appealing violation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit appeal",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get citizen's complaints
   * @route GET /api/citizen/complaints
   */
  static async getMyComplaints(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const skip = (page - 1) * limit;

      const where: any = {
        complainerId: userId,
      };

      if (status && status !== "all") {
        where.status = status;
      }

      if (type && type !== "all") {
        where.type = type;
      }

      const [complaints, total] = await Promise.all([
        prisma.complaint.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            location: true,
            handlingStation: true,
          },
        }),
        prisma.complaint.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          complaints: complaints.map((c) => ({
            id: c.id,
            type: c.type.toLowerCase(),
            title: c.title,
            description: c.description || "",
            location: c.location
              ? {
                  latitude: c.location.latitude,
                  longitude: c.location.longitude,
                  address: c.location.address || "",
                }
              : { latitude: 0, longitude: 0, address: "" },
            status: c.status.toLowerCase(),
            priority: c.priority?.toLowerCase() || "low",
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch complaints",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create a new complaint
   * @route POST /api/citizen/complaints
   */
  static async createComplaint(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { type, title, description, location, priority } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      // Create location first
      const createdLocation = await prisma.location.create({
        data: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          city: location.city,
          district: location.district,
          division: location.division,
          type: "COMPLAINT",
        },
      });

      // Create complaint
      const complaint = await prisma.complaint.create({
        data: {
          type: type.toUpperCase(),
          title,
          description,
          priority: priority?.toUpperCase() || "MEDIUM",
          status: "PENDING",
          complainerId: userId,
          locationId: createdLocation.id,
        },
        include: {
          location: true,
        },
      });

      res.status(201).json({
        success: true,
        message: "Complaint submitted successfully",
        data: {
          id: complaint.id,
          type: complaint.type.toLowerCase(),
          title: complaint.title,
          description: complaint.description || "",
          location: {
            latitude: complaint.location?.latitude || 0,
            longitude: complaint.location?.longitude || 0,
            address: complaint.location?.address || "",
          },
          status: complaint.status.toLowerCase(),
          priority: complaint.priority?.toLowerCase() || "low",
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error creating complaint:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create complaint",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update a complaint
   * @route PUT /api/citizen/complaints/:complaintId
   */
  static async updateComplaint(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { complaintId } = req.params;
      const updates = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      // Check if complaint belongs to user
      const complaint = await prisma.complaint.findFirst({
        where: {
          id: complaintId,
          complainerId: userId,
        },
      });

      if (!complaint) {
        res.status(404).json({
          success: false,
          message: "Complaint not found or you don't have permission",
        });
        return;
      }

      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          title: updates.title || complaint.title,
          description: updates.description || complaint.description,
          priority: updates.priority?.toUpperCase() || complaint.priority,
        },
        include: {
          location: true,
        },
      });

      res.json({
        success: true,
        message: "Complaint updated successfully",
        data: {
          id: updatedComplaint.id,
          type: updatedComplaint.type.toLowerCase(),
          title: updatedComplaint.title,
          description: updatedComplaint.description || "",
          location: {
            latitude: updatedComplaint.location?.latitude || 0,
            longitude: updatedComplaint.location?.longitude || 0,
            address: updatedComplaint.location?.address || "",
          },
          status: updatedComplaint.status.toLowerCase(),
          priority: updatedComplaint.priority?.toLowerCase() || "low",
          createdAt: updatedComplaint.createdAt,
          updatedAt: updatedComplaint.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update complaint",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get citizen's payments
   * @route GET /api/citizen/payments
   */
  static async getMyPayments(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;

      // Get user's violations with fines
      const userVehicles = await prisma.vehicle.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const vehicleIds = userVehicles.map((v) => v.id);

      const where: any = {
        violation: {
          vehicleId: { in: vehicleIds },
        },
      };

      if (status && status !== "all") {
        where.status = status.toUpperCase();
      }

      const [fines, total] = await Promise.all([
        prisma.fine.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            violation: {
              include: {
                vehicle: true,
                rule: true,
              },
            },
          },
        }),
        prisma.fine.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          payments: fines.map((f) => ({
            id: f.id,
            amount: f.amount,
            method: "online", // Default method
            status: f.status.toLowerCase(),
            description: `Fine for ${f.violation?.rule?.title || "Violation"}`,
            paidAt: f.paidAt,
            createdAt: f.createdAt,
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payments",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Create a payment
   * @route POST /api/citizen/payments
   */
  static async createPayment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { amount, method, description, violationId } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      if (!violationId) {
        res.status(400).json({
          success: false,
          message: "Violation ID is required",
        });
        return;
      }

      // Get user's vehicles
      const userVehicles = await prisma.vehicle.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });

      const vehicleIds = userVehicles.map((v) => v.id);

      // Check if violation belongs to user
      const violation = await prisma.violation.findFirst({
        where: {
          id: violationId,
          vehicleId: { in: vehicleIds },
        },
        include: {
          fine: true,
        },
      });

      if (!violation) {
        res.status(404).json({
          success: false,
          message: "Violation not found",
        });
        return;
      }

      if (!violation.fine) {
        res.status(400).json({
          success: false,
          message: "No fine associated with this violation",
        });
        return;
      }

      // Update fine status to PAID
      const updatedFine = await prisma.fine.update({
        where: { id: violation.fine.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      res.status(201).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          id: updatedFine.id,
          amount: updatedFine.amount,
          method,
          status: "paid",
          description,
          paidAt: updatedFine.paidAt,
          createdAt: updatedFine.createdAt,
        },
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process payment",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get citizen's profile
   * @route GET /api/citizen/profile
   */
  static async getMyProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          citizenGem: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          gems: user.citizenGem?.amount || 100,
          isRestricted: user.citizenGem?.isRestricted || false,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Update citizen's profile
   * @route PUT /api/citizen/profile
   */
  static async updateMyProfile(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      const updates = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: updates.firstName,
          lastName: updates.lastName,
          phone: updates.phone,
        },
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get citizen's gems
   * @route GET /api/citizen/gems
   */
  static async getMyGems(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const citizenGem = await prisma.citizenGem.findUnique({
        where: { citizenId: userId },
      });

      res.json({
        success: true,
        data: {
          totalGems: citizenGem?.amount || 100,
          recentActivities: [], // TODO: Implement activity tracking
        },
      });
    } catch (error) {
      console.error("Error fetching gems:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch gems",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get emergency contacts
   * @route GET /api/citizen/emergency-contacts
   */
  static async getEmergencyContacts(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      // Return static emergency contacts
      const emergencyContacts = [
        {
          id: "1",
          name: "Police Emergency",
          phone: "999",
          type: "police",
        },
        {
          id: "2",
          name: "Fire Service",
          phone: "102",
          type: "fire",
        },
        {
          id: "3",
          name: "Ambulance",
          phone: "199",
          type: "medical",
        },
        {
          id: "4",
          name: "Traffic Police",
          phone: "01713-398311",
          type: "traffic",
        },
      ];

      res.json({
        success: true,
        data: emergencyContacts,
      });
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch emergency contacts",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
