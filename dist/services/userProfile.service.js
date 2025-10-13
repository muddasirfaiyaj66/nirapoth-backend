import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
export class UserProfileService {
    /**
     * Get complete user profile
     */
    static async getUserProfile(userId) {
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
            throw new Error("User not found");
        }
        // Remove password from response
        const { password, ...userProfile } = user;
        return userProfile;
    }
    /**
     * Update user profile
     */
    static async updateProfile(userId, updateData) {
        // Validate badge number uniqueness for police
        if (updateData.badgeNo) {
            const existingBadge = await prisma.user.findFirst({
                where: {
                    badgeNo: updateData.badgeNo,
                    id: { not: userId },
                },
            });
            if (existingBadge) {
                throw new Error("Badge number already exists");
            }
        }
        return await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                designation: true,
                dateOfBirth: true,
                gender: true,
                bloodGroup: true,
                alternatePhone: true,
                emergencyContact: true,
                emergencyContactPhone: true,
                presentAddress: true,
                presentCity: true,
                presentDistrict: true,
                presentDivision: true,
                presentPostalCode: true,
                permanentAddress: true,
                permanentCity: true,
                permanentDistrict: true,
                permanentDivision: true,
                permanentPostalCode: true,
                badgeNo: true,
                joiningDate: true,
                rank: true,
                specialization: true,
                profileImage: true,
                updatedAt: true,
            },
        });
    }
    /**
     * Update password
     */
    static async updatePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });
        if (!user) {
            throw new Error("User not found");
        }
        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw new Error("Current password is incorrect");
        }
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { success: true, message: "Password updated successfully" };
    }
    /**
     * Get user's driving licenses
     */
    static async getUserDrivingLicenses(userId) {
        return await prisma.drivingLicense.findMany({
            where: {
                citizenId: userId,
                isActive: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }
    /**
     * Add driving license to user profile
     */
    static async addDrivingLicense(userId, licenseData) {
        // Check if license number already exists
        const existingLicense = await prisma.drivingLicense.findUnique({
            where: { licenseNo: licenseData.licenseNo },
        });
        if (existingLicense) {
            throw new Error("Driving license number already exists");
        }
        return await prisma.drivingLicense.create({
            data: {
                ...licenseData,
                citizenId: userId,
            },
        });
    }
    /**
     * Get user statistics for dashboard
     */
    static async getUserStatistics(userId) {
        const [totalVehicles, activeAssignments, totalViolations, citizenGems, activeLicenses,] = await Promise.all([
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
        return {
            totalVehicles,
            activeAssignments,
            totalViolations,
            gems: citizenGems?.amount || 0,
            isRestricted: citizenGems?.isRestricted || false,
            activeLicenses,
        };
    }
    /**
     * Upload profile image
     */
    static async uploadProfileImage(userId, imageUrl) {
        return await prisma.user.update({
            where: { id: userId },
            data: { profileImage: imageUrl },
            select: {
                id: true,
                profileImage: true,
            },
        });
    }
    /**
     * Get users by role with complete profile (for admin)
     */
    static async getUsersByRole(role, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: {
                    role: role,
                    isDeleted: false,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    designation: true,
                    badgeNo: true,
                    rank: true,
                    joiningDate: true,
                    isEmailVerified: true,
                    isBlocked: true,
                    createdAt: true,
                    station: {
                        select: {
                            name: true,
                            code: true,
                        },
                    },
                    citizenGem: {
                        select: {
                            amount: true,
                            isRestricted: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count({
                where: {
                    role: role,
                    isDeleted: false,
                },
            }),
        ]);
        return {
            users,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page,
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }
    /**
     * Validate user profile completeness
     */
    static validateProfileCompleteness(user) {
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
            POLICE: ["badgeNo", "joiningDate", "rank", "designation"],
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
        return {
            isComplete: missingFields.length === 0,
            missingFields,
            completionPercentage,
        };
    }
}
