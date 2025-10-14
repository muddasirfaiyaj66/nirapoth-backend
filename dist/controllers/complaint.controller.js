import { PrismaClient } from "@prisma/client";
import { z } from "zod";
const prisma = new PrismaClient();
// Validation schemas
const createComplaintSchema = z.object({
    type: z.enum(["TRAFFIC", "INFRASTRUCTURE"]),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    locationData: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().min(1, "Address is required"),
        city: z.string().optional(),
        district: z.string().optional(),
        division: z.string().optional(),
    }),
});
const updateComplaintStatusSchema = z.object({
    status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
    notes: z.string().optional(),
});
const assignComplaintSchema = z.object({
    complaintId: z.string().uuid("Invalid complaint ID"),
    stationId: z.string().uuid("Invalid station ID"),
    assignedOfficerId: z.string().uuid("Invalid officer ID").optional(),
});
export class ComplaintController {
    /**
     * Get all complaints with pagination and filtering
     */
    static async getAllComplaints(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const status = req.query.status;
            const type = req.query.type;
            const priority = req.query.priority;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = {};
            // Search filter
            if (search) {
                where.OR = [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
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
            // Type filter
            if (type && type !== "all") {
                where.type = type;
            }
            // Priority filter
            if (priority && priority !== "all") {
                where.priority = priority;
            }
            // Get complaints and total count
            const [complaints, total] = await Promise.all([
                prisma.complaint.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        complainer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        location: true,
                        handlingStation: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                }),
                prisma.complaint.count({ where }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    complaints,
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching complaints:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get complaint by ID
     */
    static async getComplaintById(req, res) {
        try {
            const { complaintId } = req.params;
            const complaint = await prisma.complaint.findUnique({
                where: { id: complaintId },
                include: {
                    complainer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    location: true,
                    handlingStation: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            });
            if (!complaint) {
                res.status(404).json({
                    success: false,
                    message: "Complaint not found",
                    statusCode: 404,
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: complaint,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching complaint:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Create new complaint
     */
    static async createComplaint(req, res) {
        try {
            const validatedData = createComplaintSchema.parse(req.body);
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "User not authenticated",
                    statusCode: 401,
                });
                return;
            }
            // Create location first
            const location = await prisma.location.create({
                data: {
                    latitude: validatedData.locationData.latitude,
                    longitude: validatedData.locationData.longitude,
                    address: validatedData.locationData.address,
                    city: validatedData.locationData.city,
                    district: validatedData.locationData.district,
                    division: validatedData.locationData.division,
                    country: "Bangladesh",
                    type: "COMPLAINT",
                },
            });
            // Create complaint
            const complaint = await prisma.complaint.create({
                data: {
                    type: validatedData.type,
                    title: validatedData.title,
                    description: validatedData.description,
                    priority: validatedData.priority || "MEDIUM",
                    status: "PENDING",
                    complainerId: userId,
                    locationId: location.id,
                },
                include: {
                    complainer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    location: true,
                },
            });
            res.status(201).json({
                success: true,
                message: "Complaint created successfully",
                data: complaint,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error creating complaint:", error);
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
     * Update complaint status
     */
    static async updateComplaintStatus(req, res) {
        try {
            const { complaintId } = req.params;
            const validatedData = updateComplaintStatusSchema.parse(req.body);
            // Check if complaint exists
            const complaint = await prisma.complaint.findUnique({
                where: { id: complaintId },
            });
            if (!complaint) {
                res.status(404).json({
                    success: false,
                    message: "Complaint not found",
                    statusCode: 404,
                });
                return;
            }
            // Update complaint
            const updatedComplaint = await prisma.complaint.update({
                where: { id: complaintId },
                data: {
                    status: validatedData.status,
                    resolvedAt: validatedData.status === "RESOLVED" ? new Date() : null,
                },
                include: {
                    complainer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    location: true,
                    handlingStation: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Complaint status updated successfully",
                data: updatedComplaint,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating complaint status:", error);
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
     * Assign complaint to police station
     */
    static async assignComplaint(req, res) {
        try {
            const validatedData = assignComplaintSchema.parse(req.body);
            // Check if complaint exists
            const complaint = await prisma.complaint.findUnique({
                where: { id: validatedData.complaintId },
            });
            if (!complaint) {
                res.status(404).json({
                    success: false,
                    message: "Complaint not found",
                    statusCode: 404,
                });
                return;
            }
            // Check if station exists
            const station = await prisma.policeStation.findUnique({
                where: { id: validatedData.stationId },
            });
            if (!station) {
                res.status(404).json({
                    success: false,
                    message: "Police station not found",
                    statusCode: 404,
                });
                return;
            }
            // Update complaint
            const updatedComplaint = await prisma.complaint.update({
                where: { id: validatedData.complaintId },
                data: {
                    handlingStationId: validatedData.stationId,
                    status: "IN_PROGRESS",
                },
                include: {
                    complainer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    location: true,
                    handlingStation: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                message: "Complaint assigned successfully",
                data: updatedComplaint,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error assigning complaint:", error);
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
     * Get user's complaints
     */
    static async getUserComplaints(req, res) {
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
            const complaints = await prisma.complaint.findMany({
                where: { complainerId: userId },
                orderBy: { createdAt: "desc" },
                include: {
                    location: true,
                    handlingStation: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                },
            });
            res.status(200).json({
                success: true,
                data: complaints,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching user complaints:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get complaint statistics
     */
    static async getComplaintStats(req, res) {
        try {
            const [totalComplaints, pendingComplaints, inProgressComplaints, resolvedComplaints, closedComplaints, trafficComplaints, infrastructureComplaints,] = await Promise.all([
                prisma.complaint.count(),
                prisma.complaint.count({ where: { status: "PENDING" } }),
                prisma.complaint.count({ where: { status: "IN_PROGRESS" } }),
                prisma.complaint.count({ where: { status: "RESOLVED" } }),
                prisma.complaint.count({ where: { status: "CLOSED" } }),
                prisma.complaint.count({ where: { type: "TRAFFIC" } }),
                prisma.complaint.count({ where: { type: "INFRASTRUCTURE" } }),
            ]);
            res.status(200).json({
                success: true,
                data: {
                    totalComplaints,
                    pendingComplaints,
                    inProgressComplaints,
                    resolvedComplaints,
                    closedComplaints,
                    trafficComplaints,
                    infrastructureComplaints,
                },
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching complaint stats:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
}
