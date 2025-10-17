import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { hashPassword, comparePassword } from "../utils/password";
import { updateProfileSchema, changePasswordSchema } from "../utils/validation";
import { AuthRequest, SuccessResponse } from "../types/auth";

const prisma = new PrismaClient();

/**
 * Get user profile controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
export const getUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        citizenGem: true,
        drivingLicenses: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
        vehicleAssignments: {
          where: { isActive: true },
          include: {
            vehicle: {
              select: {
                plateNo: true,
                type: true,
                brand: true,
                model: true,
              },
            },
          },
        },
        vehiclesOwned: {
          where: { isActive: true },
          select: {
            id: true,
            plateNo: true,
            type: true,
            brand: true,
            model: true,
          },
        },
        station: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
        statusCode: 404,
      });
      return;
    }

    // Remove password from response
    const { password, ...userProfile } = user;

    const response: SuccessResponse = {
      success: true,
      message: "Profile retrieved successfully",
      data: userProfile,
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Get user statistics controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
export const getUserStatistics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    const [
      totalVehicles,
      activeAssignments,
      totalViolations,
      citizenGems,
      activeLicenses,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { ownerId: userId, isActive: true },
      }),
      prisma.vehicleAssignment.count({
        where: {
          citizenId: userId,
          isActive: true,
          OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
        },
      }),
      prisma.violation.count({
        where: {
          vehicle: {
            OR: [{ ownerId: userId }, { driverId: userId }],
          },
        },
      }),
      prisma.citizenGem.findUnique({
        where: { citizenId: userId },
      }),
      prisma.drivingLicense.count({
        where: {
          citizenId: userId,
          isActive: true,
          expiryDate: { gt: new Date() },
        },
      }),
    ]);

    const response: SuccessResponse = {
      success: true,
      message: "User statistics retrieved successfully",
      data: {
        totalVehicles,
        activeAssignments,
        totalViolations,
        gems: citizenGems?.amount || 0,
        isRestricted: citizenGems?.isRestricted || false,
        activeLicenses,
      },
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get user statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Validate profile completeness controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
export const validateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        presentAddress: true,
        presentCity: true,
        presentDistrict: true,
        role: true,
        badgeNo: true,
        joiningDate: true,
        rank: true,
        designation: true,
        dateOfBirth: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
        statusCode: 404,
      });
      return;
    }

    const requiredFields = [
      "firstName",
      "lastName",
      "phone",
      "email",
      "presentAddress",
      "presentCity",
      "presentDistrict",
    ];

    const roleSpecificFields: { [key: string]: string[] } = {
      POLICE_OFFICER: ["badgeNo", "joiningDate", "rank", "designation"],
      FIRE_SERVICE: ["badgeNo", "joiningDate", "designation"],
      CITIZEN: ["dateOfBirth"],
    };

    const allRequiredFields = [
      ...requiredFields,
      ...(roleSpecificFields[user.role] || []),
    ];

    const missingFields = allRequiredFields.filter(
      (field) => !user[field as keyof typeof user]
    );
    const completionPercentage = Math.round(
      ((allRequiredFields.length - missingFields.length) /
        allRequiredFields.length) *
        100
    );

    const response: SuccessResponse = {
      success: true,
      message: "Profile validation completed",
      data: {
        isComplete: missingFields.length === 0,
        missingFields,
        completionPercentage,
      },
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Profile validation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Get user's driving licenses controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
export const getUserDrivingLicenses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    const licenses = await prisma.drivingLicense.findMany({
      where: {
        citizenId: userId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Driving licenses retrieved successfully",
      data: licenses,
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Get driving licenses error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Add driving license controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
export const addDrivingLicense = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    const licenseData = req.body;

    // Check if license number already exists
    const existingLicense = await prisma.drivingLicense.findUnique({
      where: { licenseNo: licenseData.licenseNo },
    });

    if (existingLicense) {
      res.status(409).json({
        success: false,
        message: "Driving license number already exists",
        statusCode: 409,
      });
      return;
    }

    const license = await prisma.drivingLicense.create({
      data: {
        ...licenseData,
        citizenId: userId,
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Driving license added successfully",
      data: license,
      statusCode: 201,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Add driving license error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Update user profile controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = updateProfileSchema.parse(req.body);

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Profile update request:", req.body);
      console.log("✅ Validated data:", validatedData);
    }

    // Get user ID from authenticated request
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    // Check if NID or Birth Certificate Number already exists (if provided)
    if (validatedData.nidNo || validatedData.birthCertificateNo) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(validatedData.nidNo
                  ? [{ nidNo: validatedData.nidNo }]
                  : []),
                ...(validatedData.birthCertificateNo
                  ? [{ birthCertificateNo: validatedData.birthCertificateNo }]
                  : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "NID or Birth Certificate Number already exists",
          statusCode: 409,
        });
        return;
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
      include: {
        citizenGem: true,
        drivingLicenses: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
        },
        vehicleAssignments: {
          where: { isActive: true },
          include: {
            vehicle: {
              select: {
                plateNo: true,
                type: true,
                brand: true,
                model: true,
              },
            },
          },
        },
        vehiclesOwned: {
          where: { isActive: true },
          select: {
            id: true,
            plateNo: true,
            type: true,
            brand: true,
            model: true,
          },
        },
        station: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...userProfile } = updatedUser;

    const response: SuccessResponse = {
      success: true,
      message: "Profile updated successfully",
      data: userProfile,
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("🔴 Profile validation error:", error.issues);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((err: any) => err.message),
        statusCode: 400,
      });
      return;
    }

    console.error("🔴 Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Change password controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);

    // Get user ID from authenticated request
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    // Find user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
        statusCode: 404,
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      validatedData.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
        statusCode: 400,
      });
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(validatedData.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Password changed successfully",
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((err: any) => err.message),
        statusCode: 400,
      });
      return;
    }

    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

/**
 * Upload profile image controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
export const uploadProfileImage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get user ID from authenticated request
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
        statusCode: 401,
      });
      return;
    }

    // For now, we'll expect the image URL to be provided in the request body
    // In a real application, you would handle file upload here
    const { imageUrl } = req.body;

    if (!imageUrl) {
      res.status(400).json({
        success: false,
        message: "Image URL is required",
        statusCode: 400,
      });
      return;
    }

    // Update user profile image
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: imageUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        stationId: true,
        nidNo: true,
        birthCertificateNo: true,
        profileImage: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Profile image updated successfully",
      data: { user: updatedUser },
      statusCode: 200,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Upload profile image error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      statusCode: 500,
    });
  }
};
