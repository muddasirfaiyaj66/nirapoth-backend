import { PrismaClient, DriverStatus } from "@prisma/client";
const prisma = new PrismaClient();
export class DriverProfileService {
    /**
     * Create a new driver profile
     */
    static async createDriverProfile(data) {
        // Check if user already has a driver profile
        const existingProfile = await prisma.driverProfile.findUnique({
            where: { userId: data.userId },
        });
        if (existingProfile) {
            throw new Error("User already has a driver profile");
        }
        // Verify driving license exists and belongs to user
        const drivingLicense = await prisma.drivingLicense.findFirst({
            where: {
                id: data.drivingLicenseId,
                citizenId: data.userId,
                isActive: true,
            },
        });
        if (!drivingLicense) {
            throw new Error("Valid driving license not found for this user");
        }
        // Create driver profile
        return await prisma.driverProfile.create({
            data: {
                userId: data.userId,
                drivingLicenseId: data.drivingLicenseId,
                experienceYears: data.experienceYears,
                expectedSalary: data.expectedSalary,
                preferredLocations: data.preferredLocations,
                availability: data.availability,
                bio: data.bio,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        citizenGem: { select: { amount: true, isRestricted: true } },
                    },
                },
                drivingLicense: {
                    select: {
                        licenseNo: true,
                        category: true,
                        issueDate: true,
                        expiryDate: true,
                        isActive: true,
                    },
                },
            },
        });
    }
    /**
     * Update driver profile
     */
    static async updateDriverProfile(profileId, userId, data) {
        // Verify ownership
        const profile = await prisma.driverProfile.findUnique({
            where: { id: profileId },
        });
        if (!profile || profile.userId !== userId) {
            throw new Error("Driver profile not found or unauthorized");
        }
        return await prisma.driverProfile.update({
            where: { id: profileId },
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        citizenGem: { select: { amount: true, isRestricted: true } },
                    },
                },
                drivingLicense: {
                    select: {
                        licenseNo: true,
                        category: true,
                        issueDate: true,
                        expiryDate: true,
                        isActive: true,
                    },
                },
            },
        });
    }
    /**
     * Get driver profile by ID with full transparency
     */
    static async getDriverProfileById(profileId) {
        const profile = await prisma.driverProfile.findUnique({
            where: { id: profileId },
            include: {
                user: {
                    include: {
                        citizenGem: {
                            select: {
                                amount: true,
                                isRestricted: true,
                                lastUpdated: true,
                            },
                        },
                        vehiclesOwned: {
                            include: {
                                violations: {
                                    where: {
                                        status: "PENDING",
                                    },
                                    select: {
                                        id: true,
                                        description: true,
                                        evidenceUrl: true,
                                        createdAt: true,
                                        status: true,
                                        fine: {
                                            select: {
                                                amount: true,
                                                status: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                drivingLicense: {
                    select: {
                        licenseNo: true,
                        category: true,
                        issueDate: true,
                        expiryDate: true,
                        isActive: true,
                        violationCount: true,
                        lastViolationAt: true,
                        isSuspended: true,
                        suspendedUntil: true,
                    },
                },
            },
        });
        if (!profile) {
            throw new Error("Driver profile not found");
        }
        // Get violation history for transparency
        const violations = await prisma.violation.findMany({
            where: {
                vehicle: {
                    ownerId: profile.userId,
                },
            },
            select: {
                id: true,
                description: true,
                status: true,
                evidenceUrl: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
        return {
            ...profile,
            violations,
        };
    }
    /**
     * Get driver profile by user ID
     */
    static async getDriverProfileByUserId(userId) {
        const profile = await prisma.driverProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        citizenGem: { select: { amount: true, isRestricted: true } },
                    },
                },
                drivingLicense: {
                    select: {
                        licenseNo: true,
                        category: true,
                        issueDate: true,
                        expiryDate: true,
                        isActive: true,
                    },
                },
            },
        });
        return profile;
    }
    /**
     * Search drivers with filters
     */
    static async searchDrivers(filters) {
        const where = {
            status: DriverStatus.AVAILABLE,
            user: {
                isActive: true,
                isBlocked: false,
            },
        };
        // Location filter
        if (filters.location) {
            where.preferredLocations = {
                hasSome: [filters.location],
            };
        }
        // Salary range
        if (filters.minSalary !== undefined || filters.maxSalary !== undefined) {
            where.expectedSalary = {};
            if (filters.minSalary !== undefined) {
                where.expectedSalary.gte = filters.minSalary;
            }
            if (filters.maxSalary !== undefined) {
                where.expectedSalary.lte = filters.maxSalary;
            }
        }
        // Experience filter
        if (filters.minExperience !== undefined) {
            where.experienceYears = {
                gte: filters.minExperience,
            };
        }
        // Availability filter
        if (filters.availability) {
            where.availability = filters.availability;
        }
        // Gems filter - Note: This requires the user to have a citizenGem relation
        // For now, we'll fetch all profiles and filter in memory, or use a raw query
        // This is a limitation of Prisma's nested filtering
        if (filters.minGems !== undefined) {
            // This will be handled in a post-fetch filter
        }
        const profiles = await prisma.driverProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profileImage: true,
                        citizenGem: { select: { amount: true, isRestricted: true } },
                        vehiclesOwned: {
                            select: {
                                violations: {
                                    select: {
                                        id: true,
                                        description: true,
                                        status: true,
                                        createdAt: true,
                                    },
                                },
                            },
                        },
                    },
                },
                drivingLicense: {
                    select: {
                        licenseNo: true,
                        category: true,
                        expiryDate: true,
                        isActive: true,
                    },
                },
            },
            orderBy: [{ experienceYears: "desc" }],
            take: 100,
        });
        // Post-fetch filtering for minGems
        let filteredProfiles = profiles;
        if (filters.minGems !== undefined) {
            filteredProfiles = profiles.filter((profile) => (profile.user?.citizenGem?.amount || 0) >= filters.minGems);
        }
        // Sort by gems desc, then experience desc
        filteredProfiles.sort((a, b) => {
            const gemsA = a.user?.citizenGem?.amount || 0;
            const gemsB = b.user?.citizenGem?.amount || 0;
            if (gemsB !== gemsA)
                return gemsB - gemsA;
            return b.experienceYears - a.experienceYears;
        });
        return filteredProfiles.slice(0, 50); // Return max 50 results
    }
    /**
     * Update driver status
     */
    static async updateDriverStatus(profileId, userId, status) {
        // Verify ownership
        const profile = await prisma.driverProfile.findUnique({
            where: { id: profileId },
        });
        if (!profile || profile.userId !== userId) {
            throw new Error("Driver profile not found or unauthorized");
        }
        return await prisma.driverProfile.update({
            where: { id: profileId },
            data: { status },
        });
    }
    /**
     * Delete driver profile
     */
    static async deleteDriverProfile(profileId, userId) {
        // Verify ownership
        const profile = await prisma.driverProfile.findUnique({
            where: { id: profileId },
        });
        if (!profile || profile.userId !== userId) {
            throw new Error("Driver profile not found or unauthorized");
        }
        // Check if driver has active assignments
        const activeAssignments = await prisma.vehicleAssignment.findMany({
            where: {
                driverId: userId,
                status: "ACTIVE",
            },
        });
        if (activeAssignments.length > 0) {
            throw new Error("Cannot delete profile with active vehicle assignments");
        }
        await prisma.driverProfile.delete({
            where: { id: profileId },
        });
    }
}
