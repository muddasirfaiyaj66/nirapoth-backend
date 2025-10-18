"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileController = void 0;
const zod_1 = require("zod");
const userProfile_service_1 = require("../services/userProfile.service");
// Validation schemas
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .min(2, "First name must be at least 2 characters")
        .optional(),
    lastName: zod_1.z
        .string()
        .min(2, "Last name must be at least 2 characters")
        .optional(),
    phone: zod_1.z.string().min(10, "Phone number must be valid").optional(),
    dateOfBirth: zod_1.z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    bloodGroup: zod_1.z.string().optional(),
    profileImage: zod_1.z.string().url("Invalid image URL").optional(),
    // Contact Information
    alternatePhone: zod_1.z.string().optional(),
    emergencyContact: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z.string().optional(),
    // Present Address
    presentAddress: zod_1.z.string().optional(),
    presentCity: zod_1.z.string().optional(),
    presentDistrict: zod_1.z.string().optional(),
    presentDivision: zod_1.z.string().optional(),
    presentPostalCode: zod_1.z.string().optional(),
    // Permanent Address
    permanentAddress: zod_1.z.string().optional(),
    permanentCity: zod_1.z.string().optional(),
    permanentDistrict: zod_1.z.string().optional(),
    permanentDivision: zod_1.z.string().optional(),
    permanentPostalCode: zod_1.z.string().optional(),
    // Professional Information (for police/fire service)
    designation: zod_1.z.string().optional(),
    badgeNo: zod_1.z.string().optional(),
    joiningDate: zod_1.z
        .string()
        .optional()
        .transform((str) => (str ? new Date(str) : undefined)),
    rank: zod_1.z.string().optional(),
    specialization: zod_1.z.string().optional(),
});
const changePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z
        .string()
        .min(8, "New password must be at least 8 characters"),
    confirmPassword: zod_1.z.string().min(1, "Confirm password is required"),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
const addLicenseSchema = zod_1.z.object({
    licenseNo: zod_1.z.string().min(1, "License number is required"),
    category: zod_1.z.enum([
        "LIGHT_VEHICLE",
        "MOTORCYCLE",
        "LIGHT_VEHICLE_MOTORCYCLE",
        "HEAVY_VEHICLE",
        "PSV",
        "GOODS_VEHICLE",
    ]),
    issueDate: zod_1.z.string().transform((str) => new Date(str)),
    expiryDate: zod_1.z.string().transform((str) => new Date(str)),
    issuingAuthority: zod_1.z.string().min(1, "Issuing authority is required"),
});
class UserProfileController {
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
            const profile = await userProfile_service_1.UserProfileService.getUserProfile(userId);
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
            const updatedProfile = await userProfile_service_1.UserProfileService.updateProfile(userId, validatedData);
            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: updatedProfile,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating profile:", error);
            if (error instanceof zod_1.z.ZodError) {
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
            const result = await userProfile_service_1.UserProfileService.updatePassword(userId, validatedData.currentPassword, validatedData.newPassword);
            res.status(200).json({
                success: true,
                message: result.message,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error changing password:", error);
            if (error instanceof zod_1.z.ZodError) {
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
            const licenses = await userProfile_service_1.UserProfileService.getUserDrivingLicenses(userId);
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
            const license = await userProfile_service_1.UserProfileService.addDrivingLicense(userId, validatedData);
            res.status(201).json({
                success: true,
                message: "Driving license added successfully",
                data: license,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error adding driving license:", error);
            if (error instanceof zod_1.z.ZodError) {
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
            const statistics = await userProfile_service_1.UserProfileService.getUserStatistics(userId);
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
            const result = await userProfile_service_1.UserProfileService.uploadProfileImage(userId, imageUrl);
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
            const profile = await userProfile_service_1.UserProfileService.getUserProfile(userId);
            const validation = userProfile_service_1.UserProfileService.validateProfileCompleteness(profile);
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
            const result = await userProfile_service_1.UserProfileService.getUsersByRole(role, page, limit);
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
exports.UserProfileController = UserProfileController;
