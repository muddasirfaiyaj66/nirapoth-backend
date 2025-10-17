import { Request, Response } from "express";
import VehicleService from "../services/vehicle.service";
import { VehicleType } from "@prisma/client";

class VehicleController {
  /**
   * Create a new vehicle (Citizen only)
   * POST /api/vehicles
   */
  async createVehicle(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const {
        type,
        plateNo,
        brand,
        model,
        year,
        color,
        engineNo,
        chassisNo,
        registrationNo,
        registrationDate,
        expiresAt,
      } = req.body;

      // Validation
      if (!type || !plateNo || !engineNo || !chassisNo) {
        res.status(400).json({
          success: false,
          message:
            "Missing required fields: type, plateNo, engineNo, chassisNo",
        });
        return;
      }

      const vehicle = await VehicleService.createVehicle({
        type: type as VehicleType,
        plateNo,
        brand,
        model,
        year: year ? parseInt(year) : undefined,
        color,
        engineNo,
        chassisNo,
        registrationNo,
        registrationDate: registrationDate
          ? new Date(registrationDate)
          : undefined,
        ownerId: userId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      res.status(201).json({
        success: true,
        message: "Vehicle registered successfully",
        data: vehicle,
      });
    } catch (error: any) {
      console.error("❌ Error creating vehicle:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create vehicle",
      });
    }
  }

  /**
   * Get all vehicles for current user
   * GET /api/vehicles/my-vehicles
   */
  async getMyVehicles(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const vehicles = await VehicleService.getVehiclesByUserId(userId);

      res.status(200).json({
        success: true,
        data: vehicles,
      });
    } catch (error: any) {
      console.error("❌ Error fetching vehicles:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch vehicles",
      });
    }
  }

  /**
   * Get vehicle by ID
   * GET /api/vehicles/:id
   */
  async getVehicleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const vehicle = await VehicleService.getVehicleById(id);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error: any) {
      console.error("❌ Error fetching vehicle:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch vehicle",
      });
    }
  }

  /**
   * Get vehicle by plate number (Admin/Police)
   * GET /api/vehicles/by-plate/:plateNo
   */
  async getVehicleByPlateNo(req: Request, res: Response): Promise<void> {
    try {
      const { plateNo } = req.params;

      const vehicle = await VehicleService.getVehicleByPlateNo(plateNo);

      if (!vehicle) {
        res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: vehicle,
      });
    } catch (error: any) {
      console.error("❌ Error fetching vehicle:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch vehicle",
      });
    }
  }

  /**
   * Update vehicle information
   * PATCH /api/vehicles/:id
   */
  async updateVehicle(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const { type, brand, model, year, color, expiresAt, isActive } = req.body;

      const vehicle = await VehicleService.updateVehicle(id, userId, {
        type,
        brand,
        model,
        year: year ? parseInt(year) : undefined,
        color,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isActive,
      });

      res.status(200).json({
        success: true,
        message: "Vehicle updated successfully",
        data: vehicle,
      });
    } catch (error: any) {
      console.error("❌ Error updating vehicle:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update vehicle",
      });
    }
  }

  /**
   * Delete vehicle (soft delete)
   * DELETE /api/vehicles/:id
   */
  async deleteVehicle(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      await VehicleService.deleteVehicle(id, userId);

      res.status(200).json({
        success: true,
        message: "Vehicle deleted successfully",
      });
    } catch (error: any) {
      console.error("❌ Error deleting vehicle:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete vehicle",
      });
    }
  }

  /**
   * Get vehicle statistics
   * GET /api/vehicles/:id/stats
   */
  async getVehicleStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const stats = await VehicleService.getVehicleStats(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("❌ Error fetching vehicle stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch vehicle statistics",
      });
    }
  }

  /**
   * Search vehicles (Admin/Police)
   * GET /api/vehicles/search?q=plateNo
   */
  async searchVehicles(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;

      if (
        userRole !== "POLICE" &&
        userRole !== "ADMIN" &&
        userRole !== "SUPER_ADMIN"
      ) {
        res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const { q, limit } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: "Search query is required",
        });
        return;
      }

      const vehicles = await VehicleService.searchVehicles(
        q as string,
        limit ? parseInt(limit as string) : 10
      );

      res.status(200).json({
        success: true,
        data: vehicles,
      });
    } catch (error: any) {
      console.error("❌ Error searching vehicles:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to search vehicles",
      });
    }
  }
}

export default new VehicleController();
