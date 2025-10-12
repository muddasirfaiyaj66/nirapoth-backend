import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AuthRequest } from "../types/auth";
import { DriverGemService } from "../services/driverGem.service";
import { StatusUtils } from "../utils/status.utils";

const prisma = new PrismaClient();

// Validation schemas
const blockUserSchema = z.object({
  userId: z.string().uuid(),
  blocked: z.boolean().default(true),
  reason: z.string().optional(),
});

const softDeleteUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

const manageDriverGemsSchema = z.object({
  driverId: z.string().uuid(),
  action: z.enum(["increase", "decrease", "set"]),
  amount: z.number().min(0),
});

const setDriverRestrictionSchema = z.object({
  driverId: z.string().uuid(),
  isRestricted: z.boolean(),
});

/**
 * Admin controller for managing user status and driver restrictions
 * Only accessible by ADMIN users
 */
export class AdminController {
  /**
   * Block or unblock a user
   */
  static async blockUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validatedData = blockUserSchema.parse(req.body);
      const { userId, blocked, reason } = validatedData;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
          statusCode: 404,
        });
        return;
      }

      if (user.isDeleted) {
        res.status(400).json({
          success: false,
          message: "Cannot block a deleted user",
          statusCode: 400,
        });
        return;
      }

      // Update user status
      await StatusUtils.blockUser(userId, blocked);

      res.status(200).json({
        success: true,
        message: `User has been ${
          blocked ? "blocked" : "unblocked"
        } successfully`,
        data: {
          userId,
          blocked,
          reason,
        },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error blocking user:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
          statusCode: 400,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Soft delete a user
   */
  static async softDeleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validatedData = softDeleteUserSchema.parse(req.body);
      const { userId, reason } = validatedData;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
          statusCode: 404,
        });
        return;
      }

      if (user.isDeleted) {
        res.status(400).json({
          success: false,
          message: "User is already deleted",
          statusCode: 400,
        });
        return;
      }

      // Soft delete user
      await StatusUtils.softDeleteUser(userId);

      res.status(200).json({
        success: true,
        message: "User has been deleted successfully",
        data: {
          userId,
          reason,
        },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
          statusCode: 400,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Manage driver gems (increase, decrease, or set)
   */
  static async manageDriverGems(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const validatedData = manageDriverGemsSchema.parse(req.body);
      const { driverId, action, amount } = validatedData;

      // Check if driver exists
      const driver = await prisma.user.findUnique({
        where: {
          id: driverId,
          role: "DRIVER",
        },
      });

      if (!driver) {
        res.status(404).json({
          success: false,
          message: "Driver not found",
          statusCode: 404,
        });
        return;
      }

      if (driver.isDeleted || driver.isBlocked) {
        res.status(400).json({
          success: false,
          message: "Cannot manage gems for deleted or blocked driver",
          statusCode: 400,
        });
        return;
      }

      let updatedGems;

      switch (action) {
        case "increase":
          updatedGems = await DriverGemService.increaseGems(driverId, amount);
          break;
        case "decrease":
          updatedGems = await DriverGemService.decreaseGems(driverId, amount);
          break;
        case "set":
          updatedGems = await DriverGemService.updateDriverGems(
            driverId,
            amount
          );
          break;
        default:
          res.status(400).json({
            success: false,
            message: "Invalid action",
            statusCode: 400,
          });
          return;
      }

      res.status(200).json({
        success: true,
        message: `Driver gems ${action} successfully`,
        data: {
          driverId,
          action,
          amount,
          newGemAmount: updatedGems.amount,
          isRestricted: updatedGems.isRestricted,
        },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error managing driver gems:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
          statusCode: 400,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Set driver restriction status (admin override)
   */
  static async setDriverRestriction(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const validatedData = setDriverRestrictionSchema.parse(req.body);
      const { driverId, isRestricted } = validatedData;

      // Check if driver exists
      const driver = await prisma.user.findUnique({
        where: {
          id: driverId,
          role: "DRIVER",
        },
      });

      if (!driver) {
        res.status(404).json({
          success: false,
          message: "Driver not found",
          statusCode: 404,
        });
        return;
      }

      // Set restriction status (with constraint enforcement)
      const updatedGems = await DriverGemService.setRestrictionStatus(
        driverId,
        isRestricted
      );

      res.status(200).json({
        success: true,
        message: "Driver restriction status updated successfully",
        data: {
          driverId,
          requestedRestriction: isRestricted,
          actualRestriction: updatedGems.isRestricted,
          gemAmount: updatedGems.amount,
          note:
            updatedGems.amount <= 0
              ? "Restriction forced to true due to low gems"
              : null,
        },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error setting driver restriction:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
          statusCode: 400,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get driver gem information
   */
  static async getDriverGems(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { driverId } = req.params;

      if (!driverId) {
        res.status(400).json({
          success: false,
          message: "Driver ID is required",
          statusCode: 400,
        });
        return;
      }

      const driverGems = await DriverGemService.getDriverGems(driverId);

      if (!driverGems) {
        res.status(404).json({
          success: false,
          message: "Driver gems not found",
          statusCode: 404,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Driver gems retrieved successfully",
        data: driverGems,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error getting driver gems:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Enforce driver gem constraints across all drivers
   */
  static async enforceConstraints(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const violationsFixed = await StatusUtils.enforceDriverGemConstraints();

      res.status(200).json({
        success: true,
        message: "Driver gem constraints enforced successfully",
        data: {
          violationsFixed,
        },
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error enforcing constraints:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }
}
