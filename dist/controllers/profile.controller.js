"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImage = exports.changePassword = exports.updateProfile = exports.addDrivingLicense = exports.getUserDrivingLicenses = exports.validateProfile = exports.getUserStatistics = exports.getUserProfile = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const password_1 = require("../utils/password");
const validation_1 = require("../utils/validation");
const prisma = new client_1.PrismaClient();
/**
 * Get user profile controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
const getUserProfile = async (req, res) => {
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
                ownerAssignments: {
                    where: { status: "ACTIVE" },
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
        const response = {
            success: true,
            message: "Profile retrieved successfully",
            data: userProfile,
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Get user profile error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            statusCode: 500,
        });
    }
};
exports.getUserProfile = getUserProfile;
/**
 * Get user statistics controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
const getUserStatistics = async (req, res) => {
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
        const [totalVehicles, activeAssignments, totalViolations, citizenGems, activeLicenses,] = await Promise.all([
            prisma.vehicle.count({
                where: { ownerId: userId, isActive: true },
            }),
            prisma.vehicleAssignment.count({
                where: {
                    driverId: userId,
                    status: "ACTIVE",
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
        const response = {
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
    }
    catch (error) {
        console.error("Get user statistics error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            statusCode: 500,
        });
    }
};
exports.getUserStatistics = getUserStatistics;
/**
 * Validate profile completeness controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
const validateProfile = async (req, res) => {
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
        const roleSpecificFields = {
            POLICE_OFFICER: ["badgeNo", "joiningDate", "rank", "designation"],
            FIRE_SERVICE: ["badgeNo", "joiningDate", "designation"],
            CITIZEN: ["dateOfBirth"],
        };
        const allRequiredFields = [
            ...requiredFields,
            ...(roleSpecificFields[user.role] || []),
        ];
        const missingFields = allRequiredFields.filter((field) => !user[field]);
        const completionPercentage = Math.round(((allRequiredFields.length - missingFields.length) /
            allRequiredFields.length) *
            100);
        const response = {
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
    }
    catch (error) {
        console.error("Profile validation error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            statusCode: 500,
        });
    }
};
exports.validateProfile = validateProfile;
/**
 * Get user's driving licenses controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
const getUserDrivingLicenses = async (req, res) => {
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
        const response = {
            success: true,
            message: "Driving licenses retrieved successfully",
            data: licenses,
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Get driving licenses error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            statusCode: 500,
        });
    }
};
exports.getUserDrivingLicenses = getUserDrivingLicenses;
/**
 * Add driving license controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
const addDrivingLicense = async (req, res) => {
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
        const response = {
            success: true,
            message: "Driving license added successfully",
            data: license,
            statusCode: 201,
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error("Add driving license error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            statusCode: 500,
        });
    }
};
exports.addDrivingLicense = addDrivingLicense;
/**
 * Update user profile controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
const updateProfile = async (req, res) => {
    try {
        // Validate request body
        const validatedData = validation_1.updateProfileSchema.parse(req.body);
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
        // Check if NID, Birth Certificate Number, or Badge Number already exists (if provided and not empty)
        // Only check non-empty values for uniqueness
        const hasNonEmptyNid = validatedData.nidNo && validatedData.nidNo.trim() !== "";
        const hasNonEmptyBirthCert = validatedData.birthCertificateNo &&
            validatedData.birthCertificateNo.trim() !== "";
        const hasNonEmptyBadgeNo = validatedData.badgeNo && validatedData.badgeNo.trim() !== "";
        if (hasNonEmptyNid || hasNonEmptyBirthCert || hasNonEmptyBadgeNo) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    AND: [
                        { id: { not: userId } },
                        {
                            OR: [
                                ...(hasNonEmptyNid ? [{ nidNo: validatedData.nidNo }] : []),
                                ...(hasNonEmptyBirthCert
                                    ? [{ birthCertificateNo: validatedData.birthCertificateNo }]
                                    : []),
                                ...(hasNonEmptyBadgeNo
                                    ? [{ badgeNo: validatedData.badgeNo }]
                                    : []),
                            ],
                        },
                    ],
                },
            });
            if (existingUser) {
                // Determine which field caused the conflict
                let conflictField = "";
                if (hasNonEmptyNid && existingUser.nidNo === validatedData.nidNo) {
                    conflictField = "NID";
                }
                else if (hasNonEmptyBirthCert &&
                    existingUser.birthCertificateNo === validatedData.birthCertificateNo) {
                    conflictField = "Birth Certificate Number";
                }
                else if (hasNonEmptyBadgeNo &&
                    existingUser.badgeNo === validatedData.badgeNo) {
                    conflictField = "Badge Number";
                }
                res.status(409).json({
                    success: false,
                    message: `${conflictField || "NID, Birth Certificate Number, or Badge Number"} already exists`,
                    statusCode: 409,
                });
                return;
            }
        }
        // Clean the validated data - convert empty strings to null for unique constraint fields
        const updateData = {};
        const uniqueFields = ["badgeNo", "nidNo", "birthCertificateNo"];
        Object.entries(validatedData).forEach(([key, value]) => {
            if (value === undefined) {
                // Skip undefined values
                return;
            }
            if (value === "" || value === null) {
                // For unique constraint fields, convert empty string to null
                if (uniqueFields.includes(key)) {
                    updateData[key] = null;
                }
                // For other fields, skip empty strings (don't update)
                return;
            }
            // Include non-empty values
            updateData[key] = value;
        });
        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
            include: {
                citizenGem: true,
                drivingLicenses: {
                    where: { isActive: true },
                    orderBy: { createdAt: "desc" },
                },
                ownerAssignments: {
                    where: { status: "ACTIVE" },
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
        const response = {
            success: true,
            message: "Profile updated successfully",
            data: userProfile,
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error("🔴 Profile validation error:", error.issues);
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.issues.map((err) => err.message),
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
exports.updateProfile = updateProfile;
/**
 * Change password controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
const changePassword = async (req, res) => {
    try {
        // Validate request body
        const validatedData = validation_1.changePasswordSchema.parse(req.body);
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
        const isCurrentPasswordValid = await (0, password_1.comparePassword)(validatedData.currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            res.status(400).json({
                success: false,
                message: "Current password is incorrect",
                statusCode: 400,
            });
            return;
        }
        // Hash new password
        const hashedNewPassword = await (0, password_1.hashPassword)(validatedData.newPassword);
        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNewPassword,
                updatedAt: new Date(),
            },
        });
        const response = {
            success: true,
            message: "Password changed successfully",
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.issues.map((err) => err.message),
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
exports.changePassword = changePassword;
/**
 * Upload profile image controller
 * @param req - Express request object (with user attached by auth middleware)
 * @param res - Express response object
 */
const uploadProfileImage = async (req, res) => {
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
        // Log request body for debugging
        console.log("📸 Upload profile image request:", {
            userId,
            body: req.body,
            headers: req.headers["content-type"],
        });
        // For now, we'll expect the image URL to be provided in the request body
        // In a real application, you would handle file upload here
        const { imageUrl } = req.body;
        if (!imageUrl) {
            console.error("❌ No imageUrl provided in request body");
            res.status(400).json({
                success: false,
                message: "Image URL is required",
                statusCode: 400,
            });
            return;
        }
        // Validate imageUrl format
        if (typeof imageUrl !== "string" || imageUrl.trim() === "") {
            console.error("❌ Invalid imageUrl format:", imageUrl);
            res.status(400).json({
                success: false,
                message: "Invalid image URL format",
                statusCode: 400,
            });
            return;
        }
        console.log("✅ Updating profile image for user:", userId);
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
        console.log("✅ Profile image updated successfully");
        const response = {
            success: true,
            message: "Profile image updated successfully",
            data: { user: updatedUser },
            statusCode: 200,
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("❌ Upload profile image error:", error);
        console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal server error",
            statusCode: 500,
        });
    }
};
exports.uploadProfileImage = uploadProfileImage;
