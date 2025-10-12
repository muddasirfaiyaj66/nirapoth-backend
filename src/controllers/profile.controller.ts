import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { hashPassword, comparePassword } from "../utils/password";
import { updateProfileSchema, changePasswordSchema } from "../utils/validation";
import { AuthRequest, SuccessResponse } from "../types/auth";

const prisma = new PrismaClient();

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
      message: "Profile updated successfully",
      data: { user: updatedUser },
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

    console.error("Update profile error:", error);
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
