"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FineController = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// Validation schemas
const createFineSchema = zod_1.z.object({
    violationId: zod_1.z.string().uuid("Invalid violation ID"),
    amount: zod_1.z.number().min(0, "Amount must be positive"),
    dueDate: zod_1.z
        .string()
        .transform((str) => new Date(str))
        .optional(),
});
const updateFineSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0, "Amount must be positive").optional(),
    status: zod_1.z.enum(["UNPAID", "PAID", "CANCELLED", "DISPUTED"]).optional(),
    dueDate: zod_1.z
        .string()
        .transform((str) => new Date(str))
        .optional(),
});
const fineSearchSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).optional(),
    limit: zod_1.z.string().transform(Number).optional(),
    search: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    vehiclePlate: zod_1.z.string().optional(),
    dateFrom: zod_1.z.string().optional(),
    dateTo: zod_1.z.string().optional(),
});
class FineController {
    /**
     * Get all fines with pagination and filtering
     */
    static async getAllFines(req, res) {
        try {
            const validatedQuery = fineSearchSchema.parse(req.query);
            const page = validatedQuery.page || 1;
            const limit = validatedQuery.limit || 10;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {};
            // Search filter
            if (validatedQuery.search) {
                where.OR = [
                    {
                        violation: {
                            rule: {
                                title: { contains: validatedQuery.search, mode: "insensitive" },
                            },
                        },
                    },
                    {
                        violation: {
                            vehicle: {
                                plateNo: {
                                    contains: validatedQuery.search,
                                    mode: "insensitive",
                                },
                            },
                        },
                    },
                    {
                        violation: {
                            vehicle: {
                                owner: {
                                    firstName: {
                                        contains: validatedQuery.search,
                                        mode: "insensitive",
                                    },
                                },
                            },
                        },
                    },
                    {
                        violation: {
                            vehicle: {
                                owner: {
                                    lastName: {
                                        contains: validatedQuery.search,
                                        mode: "insensitive",
                                    },
                                },
                            },
                        },
                    },
                ];
            }
            // Status filter
            if (validatedQuery.status && validatedQuery.status !== "all") {
                where.status = validatedQuery.status;
            }
            // Vehicle plate filter
            if (validatedQuery.vehiclePlate) {
                where.violation = {
                    vehicle: {
                        plateNo: {
                            contains: validatedQuery.vehiclePlate,
                            mode: "insensitive",
                        },
                    },
                };
            }
            // Date range filter
            if (validatedQuery.dateFrom || validatedQuery.dateTo) {
                where.issuedAt = {};
                if (validatedQuery.dateFrom) {
                    where.issuedAt.gte = new Date(validatedQuery.dateFrom);
                }
                if (validatedQuery.dateTo) {
                    where.issuedAt.lte = new Date(validatedQuery.dateTo);
                }
            }
            // Get fines and total count
            const [fines, total] = await Promise.all([
                prisma.fine.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { issuedAt: "desc" },
                    include: {
                        violation: {
                            include: {
                                rule: true,
                                vehicle: {
                                    include: {
                                        owner: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                email: true,
                                                phone: true,
                                            },
                                        },
                                        driver: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                email: true,
                                                phone: true,
                                            },
                                        },
                                    },
                                },
                                location: true,
                            },
                        },
                        payments: {
                            orderBy: { paidAt: "desc" },
                        },
                    },
                }),
                prisma.fine.count({ where }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    fines,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching fines:", error);
            if (error instanceof zod_1.z.ZodError) {
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
     * Get fine by ID
     */
    static async getFineById(req, res) {
        try {
            const { fineId } = req.params;
            const fine = await prisma.fine.findUnique({
                where: { id: fineId },
                include: {
                    violation: {
                        include: {
                            rule: true,
                            vehicle: {
                                include: {
                                    owner: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                            phone: true,
                                        },
                                    },
                                    driver: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                            phone: true,
                                        },
                                    },
                                },
                            },
                            location: true,
                        },
                    },
                    payments: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                        orderBy: { paidAt: "desc" },
                    },
                },
            });
            if (!fine) {
                res.status(404).json({
                    success: false,
                    message: "Fine not found",
                    statusCode: 404,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: fine,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching fine:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Create new fine
     */
    static async createFine(req, res) {
        try {
            const validatedData = createFineSchema.parse(req.body);
            // Check if violation exists and doesn't already have a fine
            const violation = await prisma.violation.findUnique({
                where: { id: validatedData.violationId },
                include: { fine: true },
            });
            if (!violation) {
                res.status(404).json({
                    success: false,
                    message: "Violation not found",
                    statusCode: 404,
                });
                return;
            }
            if (violation.fine) {
                res.status(400).json({
                    success: false,
                    message: "Fine already exists for this violation",
                    statusCode: 400,
                });
                return;
            }
            // Create fine
            const fine = await prisma.fine.create({
                data: {
                    violationId: validatedData.violationId,
                    amount: validatedData.amount,
                    dueDate: validatedData.dueDate,
                    status: "UNPAID",
                },
                include: {
                    violation: {
                        include: {
                            rule: true,
                            vehicle: {
                                include: {
                                    owner: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            res.status(201).json({
                success: true,
                message: "Fine created successfully",
                data: fine,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error creating fine:", error);
            if (error instanceof zod_1.z.ZodError) {
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
     * Update fine
     */
    static async updateFine(req, res) {
        try {
            const { fineId } = req.params;
            const validatedData = updateFineSchema.parse(req.body);
            // Check if fine exists
            const existingFine = await prisma.fine.findUnique({
                where: { id: fineId },
            });
            if (!existingFine) {
                res.status(404).json({
                    success: false,
                    message: "Fine not found",
                    statusCode: 404,
                });
                return;
            }
            // Update fine
            const updatedFine = await prisma.fine.update({
                where: { id: fineId },
                data: validatedData,
                include: {
                    violation: {
                        include: {
                            rule: true,
                            vehicle: {
                                include: {
                                    owner: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Fine updated successfully",
                data: updatedFine,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating fine:", error);
            if (error instanceof zod_1.z.ZodError) {
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
     * Delete fine
     */
    static async deleteFine(req, res) {
        try {
            const { fineId } = req.params;
            // Check if fine exists
            const existingFine = await prisma.fine.findUnique({
                where: { id: fineId },
            });
            if (!existingFine) {
                res.status(404).json({
                    success: false,
                    message: "Fine not found",
                    statusCode: 404,
                });
                return;
            }
            // Check if fine has payments
            const paymentCount = await prisma.payment.count({
                where: { fineId: fineId },
            });
            if (paymentCount > 0) {
                res.status(400).json({
                    success: false,
                    message: `Cannot delete fine. It has ${paymentCount} payment(s). Consider cancelling it instead.`,
                    statusCode: 400,
                });
                return;
            }
            // Delete fine
            await prisma.fine.delete({
                where: { id: fineId },
            });
            res.status(200).json({
                success: true,
                message: "Fine deleted successfully",
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error deleting fine:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get fine statistics
     */
    static async getFineStats(req, res) {
        try {
            const [totalFines, unpaidFines, paidFines, cancelledFines, disputedFines, totalAmount, paidAmount, unpaidAmount,] = await Promise.all([
                prisma.fine.count(),
                prisma.fine.count({ where: { status: "UNPAID" } }),
                prisma.fine.count({ where: { status: "PAID" } }),
                prisma.fine.count({ where: { status: "CANCELLED" } }),
                prisma.fine.count({ where: { status: "DISPUTED" } }),
                prisma.fine.aggregate({
                    _sum: { amount: true },
                }),
                prisma.fine.aggregate({
                    _sum: { amount: true },
                    where: { status: "PAID" },
                }),
                prisma.fine.aggregate({
                    _sum: { amount: true },
                    where: { status: "UNPAID" },
                }),
            ]);
            // Get fines by month for the last 12 months
            const monthlyStats = await prisma.fine.groupBy({
                by: ["issuedAt"],
                _count: { id: true },
                _sum: { amount: true },
                where: {
                    issuedAt: {
                        gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
                    },
                },
                orderBy: { issuedAt: "asc" },
            });
            // Get fines by status distribution
            const statusDistribution = await prisma.fine.groupBy({
                by: ["status"],
                _count: { id: true },
                _sum: { amount: true },
            });
            res.status(200).json({
                success: true,
                data: {
                    totalFines,
                    unpaidFines,
                    paidFines,
                    cancelledFines,
                    disputedFines,
                    totalAmount: totalAmount._sum.amount || 0,
                    paidAmount: paidAmount._sum.amount || 0,
                    unpaidAmount: unpaidAmount._sum.amount || 0,
                    monthlyStats,
                    statusDistribution,
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching fine stats:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get user's fines
     */
    static async getUserFines(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            // Get user's vehicles
            const userVehicles = await prisma.vehicle.findMany({
                where: {
                    OR: [{ ownerId: userId }, { driverId: userId }],
                },
                select: { id: true },
            });
            const vehicleIds = userVehicles.map((v) => v.id);
            // Get fines for user's vehicles
            const fines = await prisma.fine.findMany({
                where: {
                    violation: {
                        vehicleId: { in: vehicleIds },
                    },
                },
                include: {
                    violation: {
                        include: {
                            rule: true,
                            vehicle: {
                                select: {
                                    plateNo: true,
                                    brand: true,
                                    model: true,
                                },
                            },
                        },
                    },
                    payments: {
                        orderBy: { paidAt: "desc" },
                    },
                },
                orderBy: { issuedAt: "desc" },
            });
            res.status(200).json({
                success: true,
                data: fines,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching user fines:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get overdue fines
     */
    static async getOverdueFines(req, res) {
        try {
            const currentDate = new Date();
            const overdueFines = await prisma.fine.findMany({
                where: {
                    status: "UNPAID",
                    dueDate: {
                        lt: currentDate,
                    },
                },
                include: {
                    violation: {
                        include: {
                            rule: true,
                            vehicle: {
                                include: {
                                    owner: {
                                        select: {
                                            id: true,
                                            firstName: true,
                                            lastName: true,
                                            email: true,
                                            phone: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { dueDate: "asc" },
            });
            res.status(200).json({
                success: true,
                data: overdueFines,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching overdue fines:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
}
exports.FineController = FineController;
