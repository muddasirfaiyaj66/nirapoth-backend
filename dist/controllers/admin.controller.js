import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { CitizenGemService } from "../services/citizenGem.service";
import { StatusUtils } from "../utils/status.utils";
import { canManageUser, canAssignRole, } from "../middlewares/security.middleware";
import { hashPassword } from "../utils/password";
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
const manageCitizenGemsSchema = z.object({
    citizenId: z.string().uuid(),
    action: z.enum(["increase", "decrease", "set"]),
    amount: z.number().min(0),
});
const setCitizenRestrictionSchema = z.object({
    citizenId: z.string().uuid(),
    isRestricted: z.boolean(),
});
const createUserSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    role: z.enum(["CITIZEN", "POLICE", "FIRE_SERVICE", "ADMIN", "SUPER_ADMIN"]),
    password: z.string().min(8, "Password must be at least 8 characters"),
    nidNo: z.string().optional(),
    birthCertificateNo: z.string().optional(),
});
const updateUserRoleSchema = z.object({
    userId: z.string().uuid(),
    newRole: z.enum([
        "CITIZEN",
        "POLICE",
        "FIRE_SERVICE",
        "ADMIN",
        "SUPER_ADMIN",
    ]),
});
/**
 * Admin controller for managing user status and driver restrictions
 * Only accessible by ADMIN users
 */
export class AdminController {
    /**
     * Get all users with pagination and filtering
     */
    static async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const role = req.query.role;
            const status = req.query.status;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {};
            // Search filter
            if (search) {
                where.OR = [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } },
                ];
            }
            // Role filter
            if (role && role !== "all") {
                where.role = role;
            }
            // Status filter
            if (status && status !== "all") {
                switch (status) {
                    case "active":
                        where.isBlocked = false;
                        where.isDeleted = false;
                        break;
                    case "blocked":
                        where.isBlocked = true;
                        break;
                    case "unverified":
                        where.isEmailVerified = false;
                        break;
                }
            }
            // Get users and total count
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                        isEmailVerified: true,
                        isBlocked: true,
                        isDeleted: true,
                        createdAt: true,
                        updatedAt: true,
                        profileImage: true,
                    },
                }),
                prisma.user.count({ where }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    users,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get user statistics
     */
    static async getUserStats(req, res) {
        try {
            const [totalUsers, verifiedUsers, blockedUsers, deletedUsers, adminUsers, policeUsers, fireServiceUsers, citizenUsers,] = await Promise.all([
                prisma.user.count(),
                prisma.user.count({
                    where: {
                        isEmailVerified: true,
                    },
                }),
                prisma.user.count({ where: { isBlocked: true } }),
                prisma.user.count({ where: { isDeleted: true } }),
                prisma.user.count({
                    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
                }),
                prisma.user.count({ where: { role: "POLICE" } }),
                prisma.user.count({ where: { role: "FIRE_SERVICE" } }),
                prisma.user.count({ where: { role: "CITIZEN" } }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    verifiedUsers,
                    blockedUsers,
                    deletedUsers,
                    activeUsers: totalUsers - blockedUsers - deletedUsers,
                    roleDistribution: {
                        admin: adminUsers,
                        police: policeUsers,
                        fireService: fireServiceUsers,
                        citizen: citizenUsers,
                    },
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching user stats:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Create a new user (Admin only)
     */
    static async createUser(req, res) {
        try {
            const validatedData = createUserSchema.parse(req.body);
            const currentUserRole = req.userRole;
            // Check if current user can assign the specified role
            if (!canAssignRole(currentUserRole, validatedData.role)) {
                res.status(403).json({
                    success: false,
                    message: "You don't have permission to assign this role",
                    statusCode: 403,
                });
                return;
            }
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: validatedData.email },
            });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    message: "User with this email already exists",
                    statusCode: 409,
                });
                return;
            }
            // Hash password
            const hashedPassword = await hashPassword(validatedData.password);
            // Create user
            const user = await prisma.user.create({
                data: {
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    email: validatedData.email,
                    password: hashedPassword,
                    phone: validatedData.phone,
                    role: validatedData.role,
                    nidNo: validatedData.nidNo,
                    birthCertificateNo: validatedData.birthCertificateNo,
                    isEmailVerified: true, // Admin-created users are pre-verified
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    nidNo: true,
                    birthCertificateNo: true,
                    isEmailVerified: true,
                    createdAt: true,
                },
            });
            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: user,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error creating user:", error);
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: error.issues,
                    statusCode: 400,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                    statusCode: 500,
                });
            }
        }
    }
    /**
     * Update user role (Admin only)
     */
    static async updateUserRole(req, res) {
        try {
            const validatedData = updateUserRoleSchema.parse(req.body);
            const currentUserRole = req.userRole;
            // Get the target user
            const targetUser = await prisma.user.findUnique({
                where: { id: validatedData.userId },
            });
            if (!targetUser) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                    statusCode: 404,
                });
                return;
            }
            // Check if current user can manage the target user
            if (!canManageUser(currentUserRole, targetUser.role)) {
                res.status(403).json({
                    success: false,
                    message: "You don't have permission to manage this user",
                    statusCode: 403,
                });
                return;
            }
            // Check if current user can assign the new role
            if (!canAssignRole(currentUserRole, validatedData.newRole)) {
                res.status(403).json({
                    success: false,
                    message: "You don't have permission to assign this role",
                    statusCode: 403,
                });
                return;
            }
            // Update user role
            const updatedUser = await prisma.user.update({
                where: { id: validatedData.userId },
                data: { role: validatedData.newRole },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    updatedAt: true,
                },
            });
            res.status(200).json({
                success: true,
                message: "User role updated successfully",
                data: updatedUser,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating user role:", error);
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: error.issues,
                    statusCode: 400,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                    statusCode: 500,
                });
            }
        }
    }
    /**
     * Block or unblock a user
     */
    static async blockUser(req, res) {
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
            // Check role hierarchy - only allow if current user can manage target user
            const currentUserRole = req.userRole;
            const targetUserRole = user.role;
            if (!canManageUser(currentUserRole, targetUserRole)) {
                res.status(403).json({
                    success: false,
                    message: "You don't have permission to manage this user",
                    statusCode: 403,
                });
                return;
            }
            // Update user status
            await StatusUtils.blockUser(userId, blocked);
            res.status(200).json({
                success: true,
                message: `User has been ${blocked ? "blocked" : "unblocked"} successfully`,
                data: {
                    userId,
                    blocked,
                    reason,
                },
                statusCode: 200,
            });
        }
        catch (error) {
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
    static async softDeleteUser(req, res) {
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
            // Check role hierarchy - only allow if current user can manage target user
            const currentUserRole = req.userRole;
            const targetUserRole = user.role;
            if (!canManageUser(currentUserRole, targetUserRole)) {
                res.status(403).json({
                    success: false,
                    message: "You don't have permission to delete this user",
                    statusCode: 403,
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
        }
        catch (error) {
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
     * Manage citizen gems (increase, decrease, or set)
     */
    static async manageCitizenGems(req, res) {
        try {
            const validatedData = manageCitizenGemsSchema.parse(req.body);
            const { citizenId, action, amount } = validatedData;
            // Check if citizen exists
            const citizen = await prisma.user.findUnique({
                where: {
                    id: citizenId,
                    role: "CITIZEN",
                },
            });
            if (!citizen) {
                res.status(404).json({
                    success: false,
                    message: "Citizen not found",
                    statusCode: 404,
                });
                return;
            }
            if (citizen.isDeleted || citizen.isBlocked) {
                res.status(400).json({
                    success: false,
                    message: "Cannot manage gems for deleted or blocked citizen",
                    statusCode: 400,
                });
                return;
            }
            let updatedGems;
            switch (action) {
                case "increase":
                    updatedGems = await CitizenGemService.increaseGems(citizenId, amount);
                    break;
                case "decrease":
                    updatedGems = await CitizenGemService.decreaseGems(citizenId, amount);
                    break;
                case "set":
                    updatedGems = await CitizenGemService.updateCitizenGems(citizenId, amount);
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
                message: `Citizen gems ${action} successfully`,
                data: {
                    citizenId,
                    action,
                    amount,
                    newGemAmount: updatedGems.amount,
                    isRestricted: updatedGems.isRestricted,
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error managing citizen gems:", error);
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
     * Set citizen restriction status (admin override)
     */
    static async setCitizenRestriction(req, res) {
        try {
            const validatedData = setCitizenRestrictionSchema.parse(req.body);
            const { citizenId, isRestricted } = validatedData;
            // Check if citizen exists
            const citizen = await prisma.user.findUnique({
                where: {
                    id: citizenId,
                    role: "CITIZEN",
                },
            });
            if (!citizen) {
                res.status(404).json({
                    success: false,
                    message: "Citizen not found",
                    statusCode: 404,
                });
                return;
            }
            // Set restriction status (with constraint enforcement)
            const updatedGems = await CitizenGemService.setRestrictionStatus(citizenId, isRestricted);
            res.status(200).json({
                success: true,
                message: "Citizen restriction status updated successfully",
                data: {
                    citizenId,
                    requestedRestriction: isRestricted,
                    actualRestriction: updatedGems.isRestricted,
                    gemAmount: updatedGems.amount,
                    note: updatedGems.amount <= 0
                        ? "Restriction forced to true due to low gems"
                        : null,
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error setting citizen restriction:", error);
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
     * Get citizen gem information
     */
    static async getCitizenGems(req, res) {
        try {
            const { citizenId } = req.params;
            if (!citizenId) {
                res.status(400).json({
                    success: false,
                    message: "Citizen ID is required",
                    statusCode: 400,
                });
                return;
            }
            const citizenGems = await CitizenGemService.getCitizenGems(citizenId);
            if (!citizenGems) {
                res.status(404).json({
                    success: false,
                    message: "Citizen gems not found",
                    statusCode: 404,
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Citizen gems retrieved successfully",
                data: citizenGems,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error getting citizen gems:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get all violations with pagination and filtering
     */
    static async getAllViolations(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const status = req.query.status;
            const method = req.query.method;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {};
            // Search filter
            if (search) {
                where.OR = [
                    { rule: { title: { contains: search, mode: "insensitive" } } },
                    { description: { contains: search, mode: "insensitive" } },
                    {
                        vehicle: {
                            plateNo: { contains: search, mode: "insensitive" },
                        },
                    },
                    {
                        location: {
                            address: { contains: search, mode: "insensitive" },
                        },
                    },
                ];
            }
            // Status filter
            if (status && status !== "all") {
                where.status = status;
            }
            // Get violations and total count
            const [violations, total] = await Promise.all([
                prisma.violation.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        rule: true,
                        vehicle: {
                            include: {
                                driver: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                        location: true,
                        fine: true,
                    },
                }),
                prisma.violation.count({ where }),
            ]);
            // Transform data to match frontend interface
            const transformedViolations = violations.map((violation) => ({
                id: violation.id,
                violationType: violation.rule?.title || "Traffic Violation",
                description: violation.description || "Traffic violation detected",
                fineAmount: violation.fine?.amount || violation.rule?.penalty || 1000,
                status: violation.status,
                detectionMethod: "MANUAL", // Default for now, could be added to schema later
                location: violation.location?.address || "Location not specified",
                vehiclePlateNumber: violation.vehicle?.plateNo,
                driverName: violation.vehicle?.driver
                    ? `${violation.vehicle.driver.firstName} ${violation.vehicle.driver.lastName}`
                    : null,
                evidenceImageUrl: violation.evidenceUrl,
                createdAt: violation.createdAt,
                updatedAt: violation.updatedAt,
            }));
            res.status(200).json({
                success: true,
                data: {
                    violations: transformedViolations,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching violations:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Update violation status
     */
    static async updateViolationStatus(req, res) {
        try {
            const { violationId, status } = req.body;
            if (!violationId || !status) {
                res.status(400).json({
                    success: false,
                    message: "Violation ID and status are required",
                    statusCode: 400,
                });
                return;
            }
            // Check if violation exists
            const violation = await prisma.violation.findUnique({
                where: { id: violationId },
            });
            if (!violation) {
                res.status(404).json({
                    success: false,
                    message: "Violation not found",
                    statusCode: 404,
                });
                return;
            }
            // Update violation status
            const updatedViolation = await prisma.violation.update({
                where: { id: violationId },
                data: { status },
            });
            res.status(200).json({
                success: true,
                message: "Violation status updated successfully",
                data: updatedViolation,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating violation status:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get admin dashboard overview
     */
    static async getAdminOverview(req, res) {
        try {
            // Get basic counts
            const [totalUsers, totalViolations, activeCameras, pendingComplaints] = await Promise.all([
                prisma.user.count({ where: { isDeleted: false } }),
                prisma.violation.count(),
                prisma.camera.count({ where: { status: "ACTIVE" } }),
                prisma.complaint.count({ where: { status: "PENDING" } }),
            ]);
            // Calculate total revenue
            const revenueResult = await prisma.fine.aggregate({
                _sum: { amount: true },
                where: { status: "PAID" },
            });
            const totalRevenue = revenueResult._sum.amount || 0;
            // Mock recent activity data
            const recentActivity = [
                {
                    id: "1",
                    type: "violation",
                    message: "New traffic violation detected at Dhanmondi",
                    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
                },
                {
                    id: "2",
                    type: "user",
                    message: "New user registration: John Doe",
                    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
                },
                {
                    id: "3",
                    type: "complaint",
                    message: "Complaint resolved in Gulshan area",
                    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
                },
                {
                    id: "4",
                    type: "system",
                    message: "Camera network status check completed",
                    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                },
            ];
            // Mock performance stats
            const quickStats = [
                {
                    title: "Resolution Rate",
                    value: "94.2%",
                    change: 5.2,
                    trend: "up",
                },
                {
                    title: "Response Time",
                    value: "12 min",
                    change: -8.5,
                    trend: "up",
                },
                {
                    title: "User Satisfaction",
                    value: "4.7/5",
                    change: 2.3,
                    trend: "up",
                },
                {
                    title: "System Efficiency",
                    value: "98.1%",
                    change: 1.2,
                    trend: "up",
                },
            ];
            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    totalViolations,
                    totalRevenue,
                    activeCameras,
                    pendingComplaints,
                    recentActivity,
                    quickStats,
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching admin overview:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get system analytics data
     */
    static async getSystemAnalytics(req, res) {
        try {
            const range = req.query.range || "6months";
            // Calculate date range
            const now = new Date();
            let startDate;
            switch (range) {
                case "1month":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    break;
                case "3months":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                    break;
                case "6months":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                    break;
                case "1year":
                    startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
            }
            // Get basic counts
            const [totalUsers, totalViolations, activeCameras, pendingComplaints, resolvedIncidents,] = await Promise.all([
                prisma.user.count({ where: { isDeleted: false } }),
                prisma.violation.count({ where: { createdAt: { gte: startDate } } }),
                prisma.camera.count({ where: { status: "ACTIVE" } }),
                prisma.complaint.count({ where: { status: "PENDING" } }),
                prisma.violation.count({ where: { status: "RESOLVED" } }),
            ]);
            // Calculate total revenue
            const revenueResult = await prisma.fine.aggregate({
                _sum: { amount: true },
                where: {
                    status: "PAID",
                    createdAt: { gte: startDate },
                },
            });
            const totalRevenue = revenueResult._sum.amount || 0;
            // Generate mock monthly data for charts
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({
                    month: date.toLocaleString("default", {
                        month: "short",
                        year: "2-digit",
                    }),
                });
            }
            const userGrowthData = months.map((month, index) => ({
                month: month.month,
                users: Math.floor(Math.random() * 500) + 100 + index * 50,
            }));
            const violationTrendData = months.map((month, index) => ({
                month: month.month,
                violations: Math.floor(Math.random() * 200) + 50,
                revenue: Math.floor(Math.random() * 100000) + 20000,
            }));
            const userRoleDistribution = [
                {
                    role: "Citizens",
                    count: Math.floor(totalUsers * 0.7),
                    color: "#8884d8",
                },
                {
                    role: "Drivers",
                    count: Math.floor(totalUsers * 0.2),
                    color: "#82ca9d",
                },
                {
                    role: "Police",
                    count: Math.floor(totalUsers * 0.08),
                    color: "#ffc658",
                },
                {
                    role: "Admins",
                    count: Math.floor(totalUsers * 0.02),
                    color: "#ff7300",
                },
            ];
            const violationTypeDistribution = [
                { type: "Speeding", count: 450, percentage: 35 },
                { type: "Signal Violation", count: 380, percentage: 30 },
                { type: "Wrong Lane", count: 250, percentage: 20 },
                { type: "Parking Violation", count: 120, percentage: 10 },
                { type: "Other", count: 65, percentage: 5 },
            ];
            const monthlyPerformance = months.map((month) => ({
                month: month.month,
                violations: Math.floor(Math.random() * 300) + 100,
                resolved: Math.floor(Math.random() * 250) + 80,
                revenue: Math.floor(Math.random() * 50000) + 25000,
            }));
            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    totalViolations,
                    totalRevenue,
                    activeCameras,
                    pendingComplaints,
                    resolvedIncidents,
                    userGrowthData,
                    violationTrendData,
                    userRoleDistribution,
                    violationTypeDistribution,
                    monthlyPerformance,
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching system analytics:", error);
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
    static async enforceConstraints(req, res) {
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
        }
        catch (error) {
            console.error("Error enforcing constraints:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get pending user verifications
     */
    static async getPendingVerifications(req, res) {
        try {
            const { page = 1, limit = 10, status = "PENDING" } = req.query;
            const users = await prisma.user.findMany({
                where: {
                    isEmailVerified: status === "PENDING" ? false : true,
                    isDeleted: false,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    nidNo: true,
                    birthCertificateNo: true,
                    isEmailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            });
            const total = await prisma.user.count({
                where: {
                    isEmailVerified: status === "PENDING" ? false : true,
                    isDeleted: false,
                },
            });
            res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit)),
                    },
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching pending verifications:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get role management data
     */
    static async getRoleManagement(req, res) {
        try {
            const roleStats = await prisma.user.groupBy({
                by: ["role"],
                _count: {
                    role: true,
                },
                where: {
                    isDeleted: false,
                },
            });
            const roles = roleStats.map((stat) => ({
                role: stat.role,
                count: stat._count.role,
                description: getRoleDescription(stat.role),
                permissions: getRolePermissions(stat.role),
            }));
            res.status(200).json({
                success: true,
                data: roles,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching role management:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get blocked users
     */
    static async getBlockedUsers(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const users = await prisma.user.findMany({
                where: {
                    isBlocked: true,
                    isDeleted: false,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    isBlocked: true,
                    blockedAt: true,
                    blockedBy: true,
                    createdAt: true,
                },
                orderBy: {
                    blockedAt: "desc",
                },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            });
            const total = await prisma.user.count({
                where: {
                    isBlocked: true,
                    isDeleted: false,
                },
            });
            res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit)),
                    },
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching blocked users:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Verify user
     */
    static async verifyUser(req, res) {
        try {
            const { userId, verified } = req.body;
            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    isEmailVerified: verified,
                    verifiedAt: verified ? new Date() : null,
                    verifiedBy: verified ? req.user?.id : undefined,
                },
            });
            res.status(200).json({
                success: true,
                message: `User ${verified ? "verified" : "unverified"} successfully`,
                data: user,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error verifying user:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Unblock user
     */
    static async unblockUser(req, res) {
        try {
            const { userId } = req.body;
            const user = await prisma.user.update({
                where: { id: userId },
                data: {
                    isBlocked: false,
                    unblockedAt: new Date(),
                    unblockedBy: req.user?.id,
                },
            });
            res.status(200).json({
                success: true,
                message: "User unblocked successfully",
                data: user,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error unblocking user:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
}
// Helper functions
function getRoleDescription(role) {
    const descriptions = {
        SUPER_ADMIN: "Full system access and control",
        ADMIN: "Manage users and system settings",
        POLICE: "Handle violations and incidents",
        FIRE_SERVICE: "Handle fire incidents and emergencies",
        CITIZEN: "Basic citizen access and reporting",
    };
    return descriptions[role] || "Unknown role";
}
function getRolePermissions(role) {
    const permissions = {
        SUPER_ADMIN: ["All Permissions"],
        ADMIN: ["User Management", "System Settings", "Analytics"],
        POLICE: ["Violation Management", "Incident Handling", "Camera Access"],
        FIRE_SERVICE: ["Fire Incidents", "Emergency Response", "Safety Reports"],
        CITIZEN: ["Profile Management", "Vehicle Registration", "Complaint Filing"],
    };
    return permissions[role] || ["Basic Access"];
}
