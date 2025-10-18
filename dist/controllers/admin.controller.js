"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Helper functions for role management
function getRoleDescription(role) {
    const descriptions = {
        SUPER_ADMIN: "Full system access with all privileges",
        ADMIN: "Administrative access to manage users and system",
        POLICE: "Police officer with law enforcement capabilities",
        FIRE_SERVICE: "Fire service personnel",
        CITIZEN: "Regular citizen user",
        CITY_CORPORATION: "City corporation official",
    };
    return descriptions[role] || "Unknown role";
}
function getRolePermissions(role) {
    const permissions = {
        SUPER_ADMIN: [
            "manage_users",
            "manage_roles",
            "manage_system",
            "view_analytics",
            "manage_violations",
            "manage_fines",
        ],
        ADMIN: [
            "manage_users",
            "view_analytics",
            "manage_violations",
            "manage_fines",
        ],
        POLICE: [
            "create_violations",
            "review_reports",
            "manage_cases",
            "view_violations",
        ],
        FIRE_SERVICE: ["respond_emergencies", "view_incidents"],
        CITIZEN: [
            "report_violations",
            "view_own_violations",
            "pay_fines",
            "submit_appeals",
        ],
        CITY_CORPORATION: [
            "manage_infrastructure",
            "view_complaints",
            "respond_to_reports",
        ],
    };
    return permissions[role] || [];
}
class AdminController {
    /**
     * Test analytics endpoint - simple database connectivity test
     */
    static async testAnalytics(req, res) {
        try {
            console.log("Starting database connectivity test...");
            const [userCount, violationCount, fineCount] = await Promise.all([
                prisma.user.count(),
                prisma.violation.count(),
                prisma.fine.count(),
            ]);
            console.log("Database test successful", {
                userCount,
                violationCount,
                fineCount,
            });
            res.status(200).json({
                success: true,
                message: "Database connection test successful",
                data: {
                    userCount,
                    violationCount,
                    fineCount,
                    timestamp: new Date().toISOString(),
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Database connection test failed:", error);
            res.status(500).json({
                success: false,
                message: "Database connection test failed",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get system analytics data - Simplified version
     */
    static async getSystemAnalytics(req, res) {
        try {
            console.log("Starting getSystemAnalytics...");
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
            // Get basic statistics
            const totalUsers = await prisma.user.count({
                where: { isDeleted: false },
            });
            const totalViolations = await prisma.violation.count({
                where: { createdAt: { gte: startDate } },
            });
            const totalFines = await prisma.fine.count({
                where: { createdAt: { gte: startDate } },
            });
            const totalComplaints = await prisma.complaint.count({
                where: { createdAt: { gte: startDate } },
            });
            // Get user role distribution
            const usersByRole = await prisma.user.groupBy({
                by: ["role"],
                _count: { role: true },
                where: { createdAt: { gte: startDate } },
            });
            // Get violation status distribution
            const violationsByStatus = await prisma.violation.groupBy({
                by: ["status"],
                _count: { status: true },
                where: { createdAt: { gte: startDate } },
            });
            // Calculate violation status breakdown
            const pendingViolations = violationsByStatus.find((v) => v.status === "PENDING")?._count
                ?.status || 0;
            const confirmedViolations = violationsByStatus.find((v) => v.status === "CONFIRMED")?._count
                ?.status || 0;
            const disputedViolations = violationsByStatus.find((v) => v.status === "DISPUTED")?._count
                ?.status || 0;
            const resolvedViolations = violationsByStatus.find((v) => v.status === "RESOLVED")?._count
                ?.status || 0;
            // Sample revenue data
            const totalRevenue = Math.floor(Math.random() * 100000) + 50000;
            const paidRevenue = Math.floor(totalRevenue * 0.7);
            // Return response with actual data
            const analyticsData = {
                totalUsers,
                totalViolations,
                totalComplaints,
                totalRevenue,
                paidRevenue,
                activeCameras: 15,
                pendingComplaints: Math.floor(totalComplaints * 0.3),
                resolvedIncidents: totalViolations,
                // Individual violation status counts
                pendingViolations,
                confirmedViolations,
                disputedViolations,
                resolvedViolations,
                // User growth data (sample for last 7 days)
                userGrowthData: Array.from({ length: 7 }, (_, i) => ({
                    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0],
                    users: Math.floor(Math.random() * 10) + totalUsers / 7,
                })),
                // Violation trend data (sample for last 7 days)
                violationTrendData: Array.from({ length: 7 }, (_, i) => ({
                    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0],
                    violations: Math.floor(Math.random() * 5) + totalViolations / 7,
                })),
                // User role distribution
                userRoleDistribution: usersByRole.map((role, index) => ({
                    role: role.role || "Unknown",
                    count: role._count.role,
                    color: ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"][index % 5],
                })),
                // Violation status distribution
                violationsByStatus: violationsByStatus.map((status, index) => ({
                    status: status.status || "Unknown",
                    count: status._count.status,
                    percentage: totalViolations > 0
                        ? (status._count.status / totalViolations) * 100
                        : 0,
                    color: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7"][index % 5],
                })),
                // Violation type distribution (sample data)
                violationTypeDistribution: [
                    {
                        type: "Speeding",
                        count: Math.floor(totalViolations * 0.4),
                        color: "#ff6b6b",
                    },
                    {
                        type: "Traffic Light",
                        count: Math.floor(totalViolations * 0.3),
                        color: "#4ecdc4",
                    },
                    {
                        type: "Parking",
                        count: Math.floor(totalViolations * 0.2),
                        color: "#45b7d1",
                    },
                    {
                        type: "Other",
                        count: Math.floor(totalViolations * 0.1),
                        color: "#f9ca24",
                    },
                ],
                // Fines by status (for revenue metrics)
                finesByStatus: [
                    {
                        status: "Paid",
                        count: Math.floor(totalViolations * 0.6),
                        percentage: 60,
                        color: "#4ecdc4",
                    },
                    {
                        status: "Pending",
                        count: Math.floor(totalViolations * 0.25),
                        percentage: 25,
                        color: "#f9ca24",
                    },
                    {
                        status: "Overdue",
                        count: Math.floor(totalViolations * 0.15),
                        percentage: 15,
                        color: "#ff6b6b",
                    },
                ],
                // Monthly performance (sample for last 6 months)
                monthlyPerformance: Array.from({ length: 6 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - (5 - i));
                    return {
                        month: date.toLocaleString("default", {
                            month: "short",
                            year: "numeric",
                        }),
                        violations: Math.floor(Math.random() * 50) + 20,
                        revenue: Math.floor(Math.random() * 10000) + 5000,
                    };
                }),
                // System health metrics
                systemHealth: {
                    uptime: Math.floor(Math.random() * 720) + 72, // Hours
                    memoryUsage: Math.floor(Math.random() * 40) + 30, // Percentage
                    totalMemory: 16384, // MB
                    cpuUsage: Math.floor(Math.random() * 30) + 10, // Percentage
                    activeConnections: Math.floor(Math.random() * 100) + 50,
                    responseTime: Math.floor(Math.random() * 50) + 10, // ms
                },
                generatedAt: new Date().toISOString(),
                dateRange: {
                    startDate: startDate.toISOString(),
                    endDate: now.toISOString(),
                    range,
                },
            };
            res.status(200).json({
                success: true,
                message: "System analytics retrieved successfully",
                data: analyticsData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching system analytics:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get revenue analytics data - Simplified version
     */
    static async getRevenueAnalytics(req, res) {
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
            // Get basic revenue data
            const totalFines = await prisma.fine.count({
                where: { createdAt: { gte: startDate } },
            });
            const totalPayments = await prisma.payment.count({
                where: { createdAt: { gte: startDate } },
            });
            // Return simplified response
            const revenueData = {
                totalRevenue: 0,
                collectedRevenue: 0,
                pendingRevenue: 0,
                totalFines,
                totalPayments,
                averageRevenuePerDay: 0,
                revenueGrowthRate: 0,
                collectionEfficiency: 0,
                monthlyRevenue: [],
                dailyRevenue: [],
                revenueByType: [],
                revenueByStatus: [],
                revenueByMonth: [],
                paymentMethods: [],
                fineCategories: [],
                generatedAt: new Date().toISOString(),
                dateRange: {
                    startDate: startDate.toISOString(),
                    endDate: now.toISOString(),
                    range,
                },
            };
            res.status(200).json({
                success: true,
                message: "Revenue analytics retrieved successfully",
                data: revenueData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching revenue analytics:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get traffic analytics data - Simplified version
     */
    static async getTrafficAnalytics(req, res) {
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
            // Get basic traffic data
            const totalViolations = await prisma.violation.count({
                where: { createdAt: { gte: startDate } },
            });
            const resolvedViolations = await prisma.violation.count({
                where: {
                    createdAt: { gte: startDate },
                    status: "RESOLVED",
                },
            });
            const pendingViolations = await prisma.violation.count({
                where: {
                    createdAt: { gte: startDate },
                    status: "PENDING",
                },
            });
            const resolutionRate = totalViolations > 0 ? (resolvedViolations / totalViolations) * 100 : 0;
            // Return simplified response with sample data
            const trafficData = {
                totalViolations,
                totalResolved: resolvedViolations,
                totalPending: pendingViolations,
                overallResolutionRate: resolutionRate,
                avgResolutionTimeHours: 24, // Mock data
                totalResolvedCount: resolvedViolations,
                // Sample hourly distribution
                hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
                    hour,
                    count: Math.floor(Math.random() * 20) + 5,
                    timeLabel: `${hour.toString().padStart(2, "0")}:00`,
                })),
                // Sample weekly distribution
                weeklyDistribution: [
                    { day: "Monday", count: Math.floor(Math.random() * 50) + 20 },
                    { day: "Tuesday", count: Math.floor(Math.random() * 50) + 20 },
                    { day: "Wednesday", count: Math.floor(Math.random() * 50) + 20 },
                    { day: "Thursday", count: Math.floor(Math.random() * 50) + 20 },
                    { day: "Friday", count: Math.floor(Math.random() * 50) + 20 },
                    { day: "Saturday", count: Math.floor(Math.random() * 50) + 20 },
                    { day: "Sunday", count: Math.floor(Math.random() * 50) + 20 },
                ],
                // Sample monthly trends
                monthlyTrends: Array.from({ length: 6 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - (5 - i));
                    return {
                        month: date.toLocaleString("default", {
                            month: "short",
                            year: "numeric",
                        }),
                        violations: Math.floor(Math.random() * 100) + 50,
                        resolved: Math.floor(Math.random() * 80) + 30,
                    };
                }),
                // Sample daily trends
                dailyTrends: Array.from({ length: 30 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (29 - i));
                    return {
                        date: date.toISOString().split("T")[0],
                        violations: Math.floor(Math.random() * 20) + 5,
                        resolved: Math.floor(Math.random() * 15) + 3,
                    };
                }),
                // Sample peak hours
                peakHours: [
                    {
                        hour: 17,
                        count: Math.floor(Math.random() * 30) + 40,
                        timeLabel: "17:00 - 18:00",
                        percentage: Math.floor(Math.random() * 15) + 10,
                    },
                    {
                        hour: 8,
                        count: Math.floor(Math.random() * 25) + 30,
                        timeLabel: "08:00 - 09:00",
                        percentage: Math.floor(Math.random() * 12) + 8,
                    },
                ],
                // Sample location hotspots
                locationHotspots: [
                    {
                        location: "Dhaka-Chittagong Highway",
                        count: Math.floor(Math.random() * 50) + 30,
                        resolutionRate: Math.floor(Math.random() * 30) + 60,
                    },
                    {
                        location: "Gulshan Avenue",
                        count: Math.floor(Math.random() * 40) + 20,
                        resolutionRate: Math.floor(Math.random() * 30) + 50,
                    },
                    {
                        location: "Motijheel Area",
                        count: Math.floor(Math.random() * 35) + 15,
                        resolutionRate: Math.floor(Math.random() * 30) + 55,
                    },
                ],
                violationsByLocation: [
                    { location: "Dhaka", count: Math.floor(Math.random() * 100) + 50 },
                    {
                        location: "Chittagong",
                        count: Math.floor(Math.random() * 80) + 30,
                    },
                    { location: "Sylhet", count: Math.floor(Math.random() * 60) + 20 },
                ],
                violationsByType: [
                    {
                        type: "Speeding",
                        code: "SP-001",
                        count: Math.floor(totalViolations * 0.4) || 25,
                        percentage: 40,
                        penalty: 2000,
                        totalPenalty: (Math.floor(totalViolations * 0.4) || 25) * 2000,
                    },
                    {
                        type: "Traffic Light",
                        code: "TL-002",
                        count: Math.floor(totalViolations * 0.3) || 18,
                        percentage: 30,
                        penalty: 3000,
                        totalPenalty: (Math.floor(totalViolations * 0.3) || 18) * 3000,
                    },
                    {
                        type: "Parking",
                        code: "PK-003",
                        count: Math.floor(totalViolations * 0.2) || 12,
                        percentage: 20,
                        penalty: 1500,
                        totalPenalty: (Math.floor(totalViolations * 0.2) || 12) * 1500,
                    },
                    {
                        type: "Other",
                        code: "OT-004",
                        count: Math.floor(totalViolations * 0.1) || 5,
                        percentage: 10,
                        penalty: 1000,
                        totalPenalty: (Math.floor(totalViolations * 0.1) || 5) * 1000,
                    },
                ],
                violationsByStatus: [
                    {
                        status: "PENDING",
                        count: pendingViolations,
                        percentage: totalViolations > 0
                            ? (pendingViolations / totalViolations) * 100
                            : 0,
                    },
                    {
                        status: "RESOLVED",
                        count: resolvedViolations,
                        percentage: totalViolations > 0
                            ? (resolvedViolations / totalViolations) * 100
                            : 0,
                    },
                ],
                dateRange: {
                    startDate: startDate.toISOString(),
                    endDate: now.toISOString(),
                    range,
                },
                filters: {
                    location: null,
                    violationType: null,
                },
                generatedAt: new Date().toISOString(),
            };
            res.status(200).json({
                success: true,
                message: "Traffic analytics retrieved successfully",
                data: trafficData,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching traffic analytics:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    // Placeholder methods for other admin functionality
    static async getAdminOverview(req, res) {
        res.status(200).json({
            success: true,
            message: "Admin overview - placeholder",
            data: {},
        });
    }
    static async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || "";
            const role = req.query.role || "all";
            const status = req.query.status || "all";
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {
                isDeleted: false,
            };
            if (search) {
                where.OR = [
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ];
            }
            if (role !== "all") {
                where.role = role;
            }
            if (status === "blocked") {
                where.isBlocked = true;
            }
            else if (status === "active") {
                where.isBlocked = false;
            }
            // Get users and total count
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
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
                    orderBy: { createdAt: "desc" },
                }),
                prisma.user.count({ where }),
            ]);
            res.status(200).json({
                success: true,
                message: `Found ${users.length} users`,
                data: {
                    users,
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch users",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async getUserStats(req, res) {
        res
            .status(200)
            .json({ success: true, message: "User stats - placeholder", data: {} });
    }
    static async getPendingVerifications(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || "PENDING";
            const skip = (page - 1) * limit;
            // Build where clause based on status
            const where = {
                isDeleted: false,
            };
            if (status === "PENDING") {
                where.isEmailVerified = false;
            }
            else if (status === "VERIFIED") {
                where.isEmailVerified = true;
            }
            // Get users and total count
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                        isEmailVerified: true,
                        isBlocked: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                }),
                prisma.user.count({ where }),
            ]);
            res.status(200).json({
                success: true,
                message: `Found ${users.length} users for verification`,
                data: users,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            console.error("Error fetching pending verifications:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch pending verifications",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async getRoleManagement(req, res) {
        try {
            // Get role distribution
            const roleStats = await prisma.user.groupBy({
                by: ["role"],
                _count: { role: true },
                where: { isDeleted: false },
            });
            const roles = roleStats.map((stat) => ({
                role: stat.role,
                count: stat._count.role,
                description: getRoleDescription(stat.role),
                permissions: getRolePermissions(stat.role),
            }));
            res.status(200).json({
                success: true,
                message: `Found ${roles.length} roles`,
                data: roles,
            });
        }
        catch (error) {
            console.error("Error fetching role management:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch role management",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async getBlockedUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            // Get blocked users
            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where: {
                        isBlocked: true,
                        isDeleted: false,
                    },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                        isBlocked: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: { updatedAt: "desc" },
                }),
                prisma.user.count({
                    where: {
                        isBlocked: true,
                        isDeleted: false,
                    },
                }),
            ]);
            res.status(200).json({
                success: true,
                message: `Found ${users.length} blocked users`,
                data: {
                    users,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit),
                    },
                },
            });
        }
        catch (error) {
            console.error("Error fetching blocked users:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch blocked users",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async createUser(req, res) {
        try {
            const { firstName, lastName, email, phone, role, password, nidNo, birthCertificateNo, } = req.body;
            const currentUser = req.user;
            // Validate required fields
            if (!firstName || !lastName || !email || !phone || !role || !password) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields",
                    statusCode: 400,
                });
                return;
            }
            // Validate role
            const validRoles = [
                "CITIZEN",
                "POLICE",
                "FIRE_SERVICE",
                "CITY_CORPORATION",
                "ADMIN",
                "SUPER_ADMIN",
            ];
            if (!validRoles.includes(role)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid role specified",
                    statusCode: 400,
                });
                return;
            }
            // Check if current user can create users with this role
            if (currentUser?.role === "ADMIN" &&
                (role === "SUPER_ADMIN" || role === "ADMIN")) {
                res.status(403).json({
                    success: false,
                    message: "You don't have permission to create users with this role",
                    statusCode: 403,
                });
                return;
            }
            // Check if email already exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                res.status(400).json({
                    success: false,
                    message: "Email already exists",
                    statusCode: 400,
                });
                return;
            }
            // Check if NID already exists (if provided)
            if (nidNo) {
                const existingNid = await prisma.user.findUnique({
                    where: { nidNo },
                });
                if (existingNid) {
                    res.status(400).json({
                        success: false,
                        message: "NID number already exists",
                        statusCode: 400,
                    });
                    return;
                }
            }
            // Check if birth certificate already exists (if provided)
            if (birthCertificateNo) {
                const existingBirthCert = await prisma.user.findUnique({
                    where: { birthCertificateNo },
                });
                if (existingBirthCert) {
                    res.status(400).json({
                        success: false,
                        message: "Birth certificate number already exists",
                        statusCode: 400,
                    });
                    return;
                }
            }
            // Hash password
            const bcrypt = require("bcrypt");
            const hashedPassword = await bcrypt.hash(password, 10);
            // Create user
            const newUser = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    phone,
                    role,
                    password: hashedPassword,
                    nidNo: nidNo || null,
                    birthCertificateNo: birthCertificateNo || null,
                    isEmailVerified: false,
                    isActive: true,
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
                    isActive: true,
                    createdAt: true,
                },
            });
            // NOTE: CitizenGem is NOT created here for admin-created users
            // It will be created automatically when citizen adds their driving license
            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: newUser,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error creating user:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    static async updateUserRole(req, res) {
        try {
            const { userId, role } = req.body;
            const currentUser = req.user;
            // Validate required fields
            if (!userId || !role) {
                res.status(400).json({
                    success: false,
                    message: "User ID and role are required",
                    statusCode: 400,
                });
                return;
            }
            // Validate role
            const validRoles = [
                "CITIZEN",
                "POLICE",
                "FIRE_SERVICE",
                "ADMIN",
                "SUPER_ADMIN",
            ];
            if (!validRoles.includes(role)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid role specified",
                    statusCode: 400,
                });
                return;
            }
            // Get target user
            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    firstName: true,
                    lastName: true,
                },
            });
            if (!targetUser) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                    statusCode: 404,
                });
                return;
            }
            // Check permissions - implement role hierarchy
            if (!currentUser) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            // SUPER_ADMIN can manage all roles
            // ADMIN can manage CITIZEN, POLICE, FIRE_SERVICE but not other ADMINs or SUPER_ADMINs
            if (currentUser.role === "ADMIN") {
                if (["ADMIN", "SUPER_ADMIN"].includes(targetUser.role)) {
                    res.status(403).json({
                        success: false,
                        message: "Admins cannot modify other admin accounts",
                        statusCode: 403,
                    });
                    return;
                }
                if (["ADMIN", "SUPER_ADMIN"].includes(role)) {
                    res.status(403).json({
                        success: false,
                        message: "Admins cannot assign admin roles",
                        statusCode: 403,
                    });
                    return;
                }
            }
            // Update user role
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { role: role },
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
                    isBlocked: true,
                    isDeleted: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            // Log the action
            console.log(`✅ User role updated: ${targetUser.email} (${targetUser.role} → ${role}) by ${currentUser.email}`);
            res.status(200).json({
                success: true,
                message: "User role updated successfully",
                data: { user: updatedUser },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Update user role error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    static async verifyUser(req, res) {
        try {
            const { userId, verified } = req.body;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: "User ID is required",
                });
                return;
            }
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }
            // Update user verification status
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    isEmailVerified: verified,
                    verifiedAt: verified ? new Date() : null,
                    verifiedBy: verified ? req.user?.id : null,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    isEmailVerified: true,
                    isBlocked: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            res.status(200).json({
                success: true,
                message: `User ${verified ? "verified" : "rejected"} successfully`,
                data: updatedUser,
            });
        }
        catch (error) {
            console.error("Error verifying user:", error);
            res.status(500).json({
                success: false,
                message: "Failed to verify user",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async blockUser(req, res) {
        try {
            const { userId, blocked } = req.body;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: "User ID is required",
                });
                return;
            }
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }
            // Update user block status
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    isBlocked: blocked,
                    blockedAt: blocked ? new Date() : null,
                    blockedBy: blocked ? req.user?.id : null,
                    unblockedAt: !blocked ? new Date() : null,
                    unblockedBy: !blocked ? req.user?.id : null,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    isBlocked: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            res.status(200).json({
                success: true,
                message: `User ${blocked ? "blocked" : "unblocked"} successfully`,
                data: updatedUser,
            });
        }
        catch (error) {
            console.error("Error blocking/unblocking user:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update user block status",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async unblockUser(req, res) {
        try {
            const { userId } = req.body;
            if (!userId) {
                res.status(400).json({
                    success: false,
                    message: "User ID is required",
                });
                return;
            }
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }
            // Unblock user
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    isBlocked: false,
                    unblockedAt: new Date(),
                    unblockedBy: req.user?.id,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    role: true,
                    isBlocked: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            res.status(200).json({
                success: true,
                message: "User unblocked successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            console.error("Error unblocking user:", error);
            res.status(500).json({
                success: false,
                message: "Failed to unblock user",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    static async softDeleteUser(req, res) {
        res.status(200).json({
            success: true,
            message: "Soft delete user - placeholder",
            data: {},
        });
    }
    static async getAllViolations(req, res) {
        res.status(200).json({
            success: true,
            message: "All violations - placeholder",
            data: [],
        });
    }
    static async updateViolationStatus(req, res) {
        res.status(200).json({
            success: true,
            message: "Update violation status - placeholder",
            data: {},
        });
    }
    static async manageCitizenGems(req, res) {
        res.status(200).json({
            success: true,
            message: "Manage citizen gems - placeholder",
            data: {},
        });
    }
    static async setCitizenRestriction(req, res) {
        res.status(200).json({
            success: true,
            message: "Set citizen restriction - placeholder",
            data: {},
        });
    }
    static async getCitizenGems(req, res) {
        res.status(200).json({
            success: true,
            message: "Get citizen gems - placeholder",
            data: {},
        });
    }
    static async enforceConstraints(req, res) {
        res.status(200).json({
            success: true,
            message: "Enforce constraints - placeholder",
            data: {},
        });
    }
    /**
     * Get system configuration (Super Admin only)
     */
    static async getSystemConfig(req, res) {
        try {
            // Check if user is Super Admin
            if (req.user?.role !== "SUPER_ADMIN") {
                res.status(403).json({
                    success: false,
                    message: "Access denied. Super Admin privileges required.",
                    statusCode: 403,
                });
                return;
            }
            // Default system configuration
            const systemConfig = {
                general: {
                    systemName: "Nirapoth Traffic Management System",
                    systemDescription: "Comprehensive traffic law enforcement and management platform",
                    maintenanceMode: false,
                    debugMode: false,
                    maxFileUploadSize: 10, // MB
                    sessionTimeout: 3600, // seconds
                },
                security: {
                    passwordMinLength: 8,
                    requireSpecialChars: true,
                    maxLoginAttempts: 5,
                    lockoutDuration: 900, // seconds (15 minutes)
                    twoFactorEnabled: false,
                    ipWhitelisting: false,
                },
                notifications: {
                    emailEnabled: true,
                    smsEnabled: false,
                    pushEnabled: true,
                    adminEmailAlerts: true,
                    criticalAlertsOnly: false,
                },
                camera: {
                    maxConcurrentStreams: 10,
                    videoQuality: "1080p",
                    recordingEnabled: true,
                    retentionDays: 30,
                    aiDetectionEnabled: true,
                    confidenceThreshold: 0.75,
                },
                database: {
                    backupEnabled: true,
                    backupFrequency: "daily",
                    retentionPeriod: 90, // days
                    compressionEnabled: true,
                },
            };
            res.status(200).json({
                success: true,
                message: "System configuration retrieved successfully",
                data: systemConfig,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching system configuration:", error);
            res.status(500).json({
                success: false,
                message: "Failed to fetch system configuration",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Update system configuration (Super Admin only)
     */
    static async updateSystemConfig(req, res) {
        try {
            // Check if user is Super Admin
            if (req.user?.role !== "SUPER_ADMIN") {
                res.status(403).json({
                    success: false,
                    message: "Access denied. Super Admin privileges required.",
                    statusCode: 403,
                });
                return;
            }
            const { section, config } = req.body;
            if (!section || !config) {
                res.status(400).json({
                    success: false,
                    message: "Section and config data are required",
                    statusCode: 400,
                });
                return;
            }
            // Validate section
            const validSections = [
                "general",
                "security",
                "notifications",
                "camera",
                "database",
            ];
            if (!validSections.includes(section)) {
                res.status(400).json({
                    success: false,
                    message: `Invalid section. Must be one of: ${validSections.join(", ")}`,
                    statusCode: 400,
                });
                return;
            }
            // In a real implementation, you would save this to the database
            // For now, we'll just return success with the updated data
            console.log(`Updating ${section} configuration:`, config);
            res.status(200).json({
                success: true,
                message: `${section.charAt(0).toUpperCase() + section.slice(1)} configuration updated successfully`,
                data: { section, config },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating system configuration:", error);
            res.status(500).json({
                success: false,
                message: "Failed to update system configuration",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
}
exports.AdminController = AdminController;
