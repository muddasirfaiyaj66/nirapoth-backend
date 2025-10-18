"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViolationController = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
// Validation schemas
const createViolationSchema = zod_1.z.object({
    ruleId: zod_1.z.string().uuid("Invalid rule ID"),
    vehicleId: zod_1.z.string().uuid("Invalid vehicle ID"),
    locationId: zod_1.z.string().uuid("Invalid location ID").optional(),
    description: zod_1.z.string().optional(),
    evidenceUrl: zod_1.z.string().url("Invalid evidence URL").optional(),
});
const updateViolationStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["PENDING", "CONFIRMED", "DISPUTED", "RESOLVED"]),
    notes: zod_1.z.string().optional(),
});
const createFineSchema = zod_1.z.object({
    violationId: zod_1.z.string().uuid("Invalid violation ID"),
    amount: zod_1.z.number().min(0, "Amount must be positive"),
    dueDate: zod_1.z
        .string()
        .transform((str) => new Date(str))
        .optional(),
});
const createRuleSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, "Rule code is required"),
    title: zod_1.z.string().min(1, "Rule title is required"),
    description: zod_1.z.string().min(1, "Rule description is required"),
    penalty: zod_1.z.number().min(0, "Penalty must be positive").optional(),
});
class ViolationController {
    /**
     * Get all violations with pagination and filtering
     */
    static async getAllViolations(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const status = req.query.status;
            const vehiclePlate = req.query.vehiclePlate;
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
                ];
            }
            // Status filter
            if (status && status !== "all") {
                where.status = status;
            }
            // Vehicle plate filter
            if (vehiclePlate) {
                where.vehicle = {
                    plateNo: { contains: vehiclePlate, mode: "insensitive" },
                };
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
                                owner: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                    },
                                },
                                driver: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        email: true,
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
            res.status(200).json({
                success: true,
                data: {
                    violations,
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
     * Get violation by ID
     */
    static async getViolationById(req, res) {
        try {
            const { violationId } = req.params;
            const violation = await prisma.violation.findUnique({
                where: { id: violationId },
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
                            driver: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    location: true,
                    fine: true,
                },
            });
            if (!violation) {
                res.status(404).json({
                    success: false,
                    message: "Violation not found",
                    statusCode: 404,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: violation,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching violation:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Create new violation
     */
    static async createViolation(req, res) {
        try {
            const validatedData = createViolationSchema.parse(req.body);
            // Check if rule exists
            const rule = await prisma.rule.findUnique({
                where: { id: validatedData.ruleId },
            });
            if (!rule) {
                res.status(404).json({
                    success: false,
                    message: "Rule not found",
                    statusCode: 404,
                });
                return;
            }
            // Check if vehicle exists
            const vehicle = await prisma.vehicle.findUnique({
                where: { id: validatedData.vehicleId },
            });
            if (!vehicle) {
                res.status(404).json({
                    success: false,
                    message: "Vehicle not found",
                    statusCode: 404,
                });
                return;
            }
            // Create violation
            const violation = await prisma.violation.create({
                data: {
                    ruleId: validatedData.ruleId,
                    vehicleId: validatedData.vehicleId,
                    locationId: validatedData.locationId,
                    description: validatedData.description,
                    evidenceUrl: validatedData.evidenceUrl,
                    status: "PENDING",
                },
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
                    location: true,
                },
            });
            res.status(201).json({
                success: true,
                message: "Violation created successfully",
                data: violation,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error creating violation:", error);
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
     * Update violation status
     */
    static async updateViolationStatus(req, res) {
        try {
            const { violationId } = req.params;
            const validatedData = updateViolationStatusSchema.parse(req.body);
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
            // Update violation
            const updatedViolation = await prisma.violation.update({
                where: { id: violationId },
                data: {
                    status: validatedData.status,
                },
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
                    location: true,
                    fine: true,
                },
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
     * Create fine for violation
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
     * Get all rules
     */
    static async getAllRules(req, res) {
        try {
            const rules = await prisma.rule.findMany({
                where: { isActive: true },
                orderBy: { title: "asc" },
            });
            res.status(200).json({
                success: true,
                data: rules,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching rules:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Create new rule
     */
    static async createRule(req, res) {
        try {
            const validatedData = createRuleSchema.parse(req.body);
            // Check if rule code already exists
            const existingRule = await prisma.rule.findUnique({
                where: { code: validatedData.code },
            });
            if (existingRule) {
                res.status(409).json({
                    success: false,
                    message: "Rule with this code already exists",
                    statusCode: 409,
                });
                return;
            }
            // Create rule
            const rule = await prisma.rule.create({
                data: validatedData,
            });
            res.status(201).json({
                success: true,
                message: "Rule created successfully",
                data: rule,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error creating rule:", error);
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
     * Update rule (including toggle active status)
     */
    static async updateRule(req, res) {
        try {
            const { ruleId } = req.params;
            const updateRuleSchema = zod_1.z.object({
                title: zod_1.z.string().min(1, "Rule title is required").optional(),
                description: zod_1.z
                    .string()
                    .min(1, "Rule description is required")
                    .optional(),
                penalty: zod_1.z.number().min(0, "Penalty must be positive").optional(),
                isActive: zod_1.z.boolean().optional(),
            });
            const validatedData = updateRuleSchema.parse(req.body);
            // Check if rule exists
            const existingRule = await prisma.rule.findUnique({
                where: { id: ruleId },
            });
            if (!existingRule) {
                res.status(404).json({
                    success: false,
                    message: "Rule not found",
                    statusCode: 404,
                });
                return;
            }
            // Update rule
            const updatedRule = await prisma.rule.update({
                where: { id: ruleId },
                data: validatedData,
            });
            res.status(200).json({
                success: true,
                message: "Rule updated successfully",
                data: updatedRule,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating rule:", error);
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
     * Delete rule
     */
    static async deleteRule(req, res) {
        try {
            const { ruleId } = req.params;
            // Check if rule exists
            const existingRule = await prisma.rule.findUnique({
                where: { id: ruleId },
            });
            if (!existingRule) {
                res.status(404).json({
                    success: false,
                    message: "Rule not found",
                    statusCode: 404,
                });
                return;
            }
            // Check if rule is used in any violations
            const violationCount = await prisma.violation.count({
                where: { ruleId: ruleId },
            });
            if (violationCount > 0) {
                res.status(400).json({
                    success: false,
                    message: `Cannot delete rule. It is being used in ${violationCount} violation(s). Consider deactivating it instead.`,
                    statusCode: 400,
                });
                return;
            }
            // Delete rule
            await prisma.rule.delete({
                where: { id: ruleId },
            });
            res.status(200).json({
                success: true,
                message: "Rule deleted successfully",
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error deleting rule:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get violation statistics
     */
    static async getViolationStats(req, res) {
        try {
            const [totalViolations, pendingViolations, confirmedViolations, disputedViolations, resolvedViolations, totalFines, paidFines, unpaidFines,] = await Promise.all([
                prisma.violation.count(),
                prisma.violation.count({ where: { status: "PENDING" } }),
                prisma.violation.count({ where: { status: "CONFIRMED" } }),
                prisma.violation.count({ where: { status: "DISPUTED" } }),
                prisma.violation.count({ where: { status: "RESOLVED" } }),
                prisma.fine.count(),
                prisma.fine.count({ where: { status: "PAID" } }),
                prisma.fine.count({ where: { status: "UNPAID" } }),
            ]);
            // Calculate total revenue
            const revenueResult = await prisma.fine.aggregate({
                _sum: { amount: true },
                where: { status: "PAID" },
            });
            const totalRevenue = revenueResult._sum.amount || 0;
            res.status(200).json({
                success: true,
                data: {
                    totalViolations,
                    pendingViolations,
                    confirmedViolations,
                    disputedViolations,
                    resolvedViolations,
                    totalFines,
                    paidFines,
                    unpaidFines,
                    totalRevenue,
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching violation stats:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
}
exports.ViolationController = ViolationController;
