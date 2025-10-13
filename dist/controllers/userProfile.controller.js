import { z } from "zod";
import { UserProfileService, } from "../services/userProfile.service";
// Validation schemas
const updateProfileSchema = z.object({
    firstName: z
        .string()
        .min(2, "First name must be at least 2 characters")
        .optional(),
    lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters")
        .optional(),
    phone: z.string().min(10, "Phone number must be valid").optional(),
    dateOfBirth: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    bloodGroup: z.string().optional(),
    profileImage: z.string().url("Invalid image URL").optional(),
    // Contact Information
    alternatePhone: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    // Present Address
    presentAddress: z.string().optional(),
    presentCity: z.string().optional(),
    presentDistrict: z.string().optional(),
    presentDivision: z.string().optional(),
    presentPostalCode: z.string().optional(),
    // Permanent Address
    permanentAddress: z.string().optional(),
    permanentCity: z.string().optional(),
    permanentDistrict: z.string().optional(),
    permanentDivision: z.string().optional(),
    permanentPostalCode: z.string().optional(),
    // Professional Information (for police/fire service)
    designation: z.string().optional(),
    badgeNo: z.string().optional(),
    joiningDate: z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    rank: z.string().optional(),
    specialization: z.string().optional(),
});
const changePasswordSchema = z
    .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
const addLicenseSchema = z.object({
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
});
export class UserProfileController {
    /**
     * Get complete user profile
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const profile = await UserProfileService.getUserProfile(userId);
            res.status(200).json({
                success: true,
                message: "Profile retrieved successfully",
                data: profile,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error getting profile:", error);
            if (error instanceof Error && error.message === "User not found") {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                    statusCode: 404,
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
     * Update user profile
     */
    static async updateProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const validatedData = updateProfileSchema.parse(req.body);
            const updatedProfile = await UserProfileService.updateProfile(userId, validatedData);
            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: updatedProfile,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating profile:", error);
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
                if (error.message.includes("already exists")) {
                    res.status(409).json({
                        success: false,
                        message: error.message,
                        statusCode: 409,
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
     * Change password
     */
    static async changePassword(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const validatedData = changePasswordSchema.parse(req.body);
            const result = await UserProfileService.updatePassword(userId, validatedData.currentPassword, validatedData.newPassword);
            res.status(200).json({
                success: true,
                message: result.message,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error changing password:", error);
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
                if (error.message === "Current password is incorrect") {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                        statusCode: 400,
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
     * Get user's driving licenses
     */
    static async getDrivingLicenses(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const licenses = await UserProfileService.getUserDrivingLicenses(userId);
            res.status(200).json({
                success: true,
                message: "Driving licenses retrieved successfully",
                data: licenses,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error getting driving licenses:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Add driving license
     */
    static async addDrivingLicense(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const validatedData = addLicenseSchema.parse(req.body);
            const license = await UserProfileService.addDrivingLicense(userId, validatedData);
            res.status(201).json({
                success: true,
                message: "Driving license added successfully",
                data: license,
                statusCode: 201,
            });
        }
        catch (error) {
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
     * Get user statistics for dashboard
     */
    static async getUserStatistics(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const statistics = await UserProfileService.getUserStatistics(userId);
            res.status(200).json({
                success: true,
                message: "User statistics retrieved successfully",
                data: statistics,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error getting user statistics:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Upload profile image
     */
    static async uploadProfileImage(req, res) {
        try {
            const userId = req.user?.id;
            const { imageUrl } = req.body;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            if (!imageUrl) {
                res.status(400).json({
                    success: false,
                    message: "Image URL is required",
                    statusCode: 400,
                });
                return;
            }
            const result = await UserProfileService.uploadProfileImage(userId, imageUrl);
            res.status(200).json({
                success: true,
                message: "Profile image updated successfully",
                data: result,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error uploading profile image:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Validate profile completeness
     */
    static async validateProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const profile = await UserProfileService.getUserProfile(userId);
            const validation = UserProfileService.validateProfileCompleteness(profile);
            res.status(200).json({
                success: true,
                message: "Profile validation completed",
                data: validation,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error validating profile:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get users by role (admin only)
     */
    static async getUsersByRole(req, res) {
        try {
            const { role } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await UserProfileService.getUsersByRole(role, page, limit);
            res.status(200).json({
                success: true,
                message: `Users with role ${role} retrieved successfully`,
                data: result.users,
                pagination: result.pagination,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error getting users by role:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
}
