import { Request, Response } from "express";
import { z } from "zod";
import { DrivingLicenseService } from "../services/drivingLicense.service";
import { AuthRequest } from "../types/auth";

// Validation schemas
const createLicenseSchema = z.object({
  licenseNo: z.string().min(1, "License number is required"),
  category: z.enum([
    "LIGHT_VEHICLE",
    "MOTORCYCLE",
    "LIGHT_VEHICLE_MOTORCYCLE",
    "HEAVY_VEHICLE",
    "PSV",
    "GOODS_VEHICLE",
  ]),
  issueDate: z.string().transform((str) => new Date(str)),
  expiryDate: z.string().transform((str) => new Date(str)),
  issuingAuthority: z.string().min(1, "Issuing authority is required"),
  restrictions: z.array(z.string()).optional(),
  endorsements: z.array(z.string()).optional(),
});

const suspendLicenseSchema = z.object({
  suspendedUntil: z.string().transform((str) => new Date(str)),
  reason: z.string().min(1, "Suspension reason is required"),
});

export class DrivingLicenseController {
  /**
   * Alias for getCitizenLicenses - get user's licenses
   */
  static async getUserLicenses(req: AuthRequest, res: Response): Promise<void> {
    return DrivingLicenseController.getCitizenLicenses(req, res);
  }
  /**
   * Add new driving license for citizen
   */
  static async addLicense(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validatedData = createLicenseSchema.parse(req.body);
      const citizenId = req.params.citizenId || req.user?.id;

      if (!citizenId) {
        res.status(400).json({
          success: false,
          message: "Citizen ID is required",
          statusCode: 400,
        });
        return;
      }

      const license = await DrivingLicenseService.createDrivingLicense({
        ...validatedData,
        citizenId,
      });

      res.status(201).json({
        success: true,
        message: "Driving license added successfully",
        data: license,
        statusCode: 201,
      });
    } catch (error) {
      console.error("Error adding driving license:", error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
          statusCode: 400,
        });
        return;
      }

      if (error instanceof Error && error.message.includes("already exists")) {
        res.status(409).json({
          success: false,
          message: error.message,
          statusCode: 409,
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
   * Get citizen's driving licenses
   */
  static async getCitizenLicenses(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const citizenId = req.params.citizenId || req.user?.id;

      if (!citizenId) {
        res.status(400).json({
          success: false,
          message: "Citizen ID is required",
          statusCode: 400,
        });
        return;
      }

      const licenses = await DrivingLicenseService.getCitizenLicenses(
        citizenId
      );

      res.status(200).json({
        success: true,
        message: "Licenses retrieved successfully",
        data: licenses,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error getting citizen licenses:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Verify driving license (admin only)
   */
  static async verifyLicense(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { licenseId } = req.params;
      const verifiedBy = req.user?.id;

      if (!verifiedBy) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          statusCode: 401,
        });
        return;
      }

      const updatedLicense = await DrivingLicenseService.verifyLicense(
        licenseId,
        verifiedBy
      );

      res.status(200).json({
        success: true,
        message: "License verified successfully",
        data: updatedLicense,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error verifying license:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Suspend driving license (admin only)
   */
  static async suspendLicense(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { licenseId } = req.params;
      const validatedData = suspendLicenseSchema.parse(req.body);

      const suspendedLicense = await DrivingLicenseService.suspendLicense(
        licenseId,
        validatedData.suspendedUntil,
        validatedData.reason
      );

      res.status(200).json({
        success: true,
        message: "License suspended successfully",
        data: suspendedLicense,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error suspending license:", error);

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
   * Get licenses expiring soon
   */
  static async getExpiringLicenses(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const expiringLicenses =
        await DrivingLicenseService.getLicensesExpiringSoon(days);

      res.status(200).json({
        success: true,
        message: "Expiring licenses retrieved successfully",
        data: expiringLicenses,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error getting expiring licenses:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Get all licenses for admin management
   */
  static async getAllLicenses(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string;
      const isVerified =
        req.query.isVerified === "true"
          ? true
          : req.query.isVerified === "false"
          ? false
          : undefined;
      const isExpired =
        req.query.isExpired === "true"
          ? true
          : req.query.isExpired === "false"
          ? false
          : undefined;

      const result = await DrivingLicenseService.getAllLicenses({
        page,
        limit,
        category,
        isVerified,
        isExpired,
      });

      res.status(200).json({
        success: true,
        message: "Licenses retrieved successfully",
        data: result.licenses,
        pagination: result.pagination,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error getting all licenses:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Validate license for vehicle assignment
   */
  static async validateForAssignment(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    try {
      const { citizenId } = req.params;
      const { vehicleType } = req.query;

      if (!vehicleType) {
        res.status(400).json({
          success: false,
          message: "Vehicle type is required",
          statusCode: 400,
        });
        return;
      }

      const validation =
        await DrivingLicenseService.validateForVehicleAssignment(
          citizenId,
          vehicleType as string
        );

      res.status(200).json({
        success: true,
        message: "License validation completed",
        data: validation,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error validating license:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Record violation for license holder
   */
  static async recordViolation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { licenseNo } = req.params;

      const updatedLicense = await DrivingLicenseService.recordViolation(
        licenseNo
      );

      if (!updatedLicense) {
        res.status(404).json({
          success: false,
          message: "Driving license not found",
          statusCode: 404,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Violation recorded successfully",
        data: updatedLicense,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Error recording violation:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        statusCode: 500,
      });
    }
  }

  /**
   * Alias methods for route compatibility
   */
  static async updateLicense(req: AuthRequest, res: Response): Promise<void> {
    // Implementation for updating license would go here
    res.status(501).json({
      success: false,
      message: "Update license feature not yet implemented",
      statusCode: 501,
    });
  }

  static async validateLicense(req: AuthRequest, res: Response): Promise<void> {
    return DrivingLicenseController.validateForAssignment(req, res);
  }

  static async reinstateLicense(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    // Implementation for reinstating license would go here
    res.status(501).json({
      success: false,
      message: "Reinstate license feature not yet implemented",
      statusCode: 501,
    });
  }

  static async verifyLicenseByNumber(
    req: AuthRequest,
    res: Response
  ): Promise<void> {
    return DrivingLicenseController.verifyLicense(req, res);
  }
}
