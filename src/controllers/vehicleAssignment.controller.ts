import { Request, Response } from "express";
import { z } from "zod";
import { VehicleAssignmentService } from "../services/vehicleAssignment.service";
import { AuthRequest } from "../types/auth";

// Validation schemas
const assignDriverSchema = z.object({
  citizenId: z.string().uuid("Invalid citizen ID"),
  validFrom: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  validUntil: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  notes: z.string().optional(),
  requiresApproval: z.boolean().default(false),
});

export class VehicleAssignmentController {
  /**
   * Assign driver to vehicle with license validation
   */
  static async assignDriver(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const validatedData = assignDriverSchema.parse(req.body);
      const assignedBy = req.user?.id;

      if (!assignedBy) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      const assignment = await VehicleAssignmentService.assignDriver({
        vehicleId,
        assignedBy,
        ...validatedData,
      });

      res.status(201).json({
        success: true,
        message: "Driver assigned successfully",
        data: assignment,
        statusCode: 201,
      });
    } catch (error) {
      console.error("Error assigning driver:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
          statusCode: 400,
        });
        return;
      }

      if (error instanceof Error) {
        // Handle specific business logic errors
        if (
          error.message.includes("not have a valid driving license") ||
          error.message.includes("restricted from driving")
        ) {
          res.status(422).json({
            success: false,
            message: error.message,
            statusCode: 422,
          });
          return;
        }

        if (error.message.includes("not found")) {
          res.status(404).json({
            success: false,
            message: error.message,
            statusCode: 404,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Unassign driver from vehicle
   */
  static async unassignDriver(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const unassignedBy = req.user?.id;

      if (!unassignedBy) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      const assignment = await VehicleAssignmentService.unassignDriver(
        assignmentId,
        unassignedBy
      );

      res.status(200).json({
        success: true,
        message: "Driver unassigned successfully",
        data: assignment,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error unassigning driver:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get vehicle assignments
   */
  static async getVehicleAssignments(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { vehicleId } = req.params;
      const activeOnly = req.query.activeOnly !== "false";

      const assignments = await VehicleAssignmentService.getVehicleAssignments(
        vehicleId,
        activeOnly
      );

      res.status(200).json({
        success: true,
        message: "Vehicle assignments retrieved successfully",
        data: assignments,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error getting vehicle assignments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get citizen's vehicle assignments
   */
  static async getCitizenAssignments(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const citizenId = req.params.citizenId || req.user?.id;
      const activeOnly = req.query.activeOnly !== "false";

      if (!citizenId) {
        res.status(400).json({
          success: false,
          message: "Citizen ID is required",
          statusCode: 400,
        });
        return;
      }

      const assignments = await VehicleAssignmentService.getCitizenAssignments(
        citizenId,
        activeOnly
      );

      res.status(200).json({
        success: true,
        message: "Citizen assignments retrieved successfully",
        data: assignments,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error getting citizen assignments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Approve vehicle assignment
   */
  static async approveAssignment(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { assignmentId } = req.params;
      const approvedBy = req.user?.id;

      if (!approvedBy) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      const assignment = await VehicleAssignmentService.approveAssignment(
        assignmentId,
        approvedBy
      );

      res.status(200).json({
        success: true,
        message: "Assignment approved successfully",
        data: assignment,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error approving assignment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Check if citizen can drive vehicle
   */
  static async checkDrivingEligibility(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { citizenId, vehicleId } = req.params;

      const eligibility = await VehicleAssignmentService.canDriveVehicle(
        citizenId,
        vehicleId
      );

      res.status(200).json({
        success: true,
        message: "Driving eligibility checked successfully",
        data: eligibility,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error checking driving eligibility:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get assignments expiring soon
   */
  static async getExpiringAssignments(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const assignments = await VehicleAssignmentService.getExpiringAssignments(
        days
      );

      res.status(200).json({
        success: true,
        message: "Expiring assignments retrieved successfully",
        data: assignments,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error getting expiring assignments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }
}
