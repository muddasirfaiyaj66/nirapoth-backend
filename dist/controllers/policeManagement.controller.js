"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliceManagementController = void 0;
const zod_1 = require("zod");
const policeManagement_service_1 = require("../services/policeManagement.service");
// Validation schemas
const createPoliceOfficerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, "First name must be at least 2 characters"),
    lastName: zod_1.z.string().min(2, "Last name must be at least 2 characters"),
    email: zod_1.z.string().email("Invalid email address"),
    phone: zod_1.z.string().min(10, "Phone number must be valid"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    designation: zod_1.z.string().min(2, "Designation must be at least 2 characters"),
    badgeNo: zod_1.z.string().min(1, "Badge number is required"),
    rank: zod_1.z.string().min(1, "Rank is required"),
    joiningDate: zod_1.z.string().transform((str) => new Date(str)),
    stationId: zod_1.z.string().uuid("Invalid station ID").optional(),
    specialization: zod_1.z.string().optional(),
    presentAddress: zod_1.z.string().optional(),
    presentCity: zod_1.z.string().optional(),
    presentDistrict: zod_1.z.string().optional(),
});
const createPoliceStationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Station name must be at least 2 characters"),
    code: zod_1.z.string().min(2, "Station code is required"),
    stationType: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().uuid("Invalid organization ID").optional(),
    locationData: zod_1.z.object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number(),
        address: zod_1.z.string().min(5, "Address must be at least 5 characters"),
        city: zod_1.z.string().min(2, "City is required").optional(),
        district: zod_1.z.string().min(2, "District is required").optional(),
        division: zod_1.z.string().min(2, "Division is required").optional(),
    }),
    contactData: zod_1.z.object({
        phone: zod_1.z.string().min(10, "Phone number must be valid"),
        email: zod_1.z.string().email("Invalid email address").optional(),
    }),
    capacity: zod_1.z.number().optional(),
    supervisorId: zod_1.z.string().uuid("Invalid supervisor ID").optional(),
});
const assignPoliceSchema = zod_1.z.object({
    policeId: zod_1.z.string().uuid("Invalid police ID"),
    stationId: zod_1.z.string().uuid("Invalid station ID"),
    role: zod_1.z
        .enum(["OFFICER", "INSPECTOR", "SUPERINTENDENT", "DIG", "IG"])
        .optional(),
});
const updatePoliceSchema = zod_1.z.object({
    designation: zod_1.z.string().optional(),
    rank: zod_1.z.string().optional(),
    specialization: zod_1.z.string().optional(),
    stationId: zod_1.z.string().uuid("Invalid station ID").optional(),
});
class PoliceManagementController {
    /**
     * Create new police officer
     */
    static async createPoliceOfficer(req, res) {
        try {
            const createdBy = req.user?.id;
            if (!createdBy) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const validatedData = createPoliceOfficerSchema.parse(req.body);
            const policeUser = await policeManagement_service_1.PoliceManagementService.createPoliceOfficer(validatedData, createdBy);
            res.status(201).json({
                success: true,
                message: "Police officer created successfully",
                data: policeUser,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error creating police role:", error);
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
                if (error.message === "User not found" ||
                    error.message === "Station not found") {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                        statusCode: 404,
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
     * Create new police station
     */
    static async createPoliceStation(req, res) {
        try {
            const validatedData = createPoliceStationSchema.parse(req.body);
            const station = await policeManagement_service_1.PoliceManagementService.createPoliceStation(validatedData);
            res.status(201).json({
                success: true,
                message: "Police station created successfully",
                data: station,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error creating police station:", error);
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
     * Assign police officer to station
     */
    static async assignPoliceToStation(req, res) {
        try {
            const validatedData = assignPoliceSchema.parse(req.body);
            const assignedBy = req.user?.id;
            if (!assignedBy) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const assignment = await policeManagement_service_1.PoliceManagementService.assignToStation(validatedData.policeId, validatedData.stationId, assignedBy);
            res.status(200).json({
                success: true,
                message: "Police officer assigned to station successfully",
                data: assignment,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error assigning police to station:", error);
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
                if (error.message === "Police officer not found" ||
                    error.message === "Station not found") {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                        statusCode: 404,
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
     * Get police officers by station
     */
    static async getOfficersByStation(req, res) {
        try {
            const { stationId } = req.params;
            if (!stationId) {
                res.status(400).json({
                    success: false,
                    message: "Station ID is required",
                    statusCode: 400,
                });
                return;
            }
            const officers = await policeManagement_service_1.PoliceManagementService.getOfficersByStation(stationId);
            res.status(200).json({
                success: true,
                message: "Police officers retrieved successfully",
                data: officers,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error getting officers by station:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get station hierarchy
     */
    static async getStationHierarchy(req, res) {
        try {
            const { stationId } = req.params;
            if (!stationId) {
                res.status(400).json({
                    success: false,
                    message: "Station ID is required",
                    statusCode: 400,
                });
                return;
            }
            const hierarchy = await policeManagement_service_1.PoliceManagementService.getStationHierarchy(stationId);
            res.status(200).json({
                success: true,
                message: "Station hierarchy retrieved successfully",
                data: hierarchy,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error getting station hierarchy:", error);
            if (error instanceof Error && error.message === "Station not found") {
                res.status(404).json({
                    success: false,
                    message: "Station not found",
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
     * Update police officer rank
     */
    static async updateOfficerRank(req, res) {
        try {
            const { officerId } = req.params;
            const { newRank } = req.body;
            const promotedBy = req.user?.id;
            if (!promotedBy) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            if (!officerId || !newRank) {
                res.status(400).json({
                    success: false,
                    message: "Officer ID and new rank are required",
                    statusCode: 400,
                });
                return;
            }
            const result = await policeManagement_service_1.PoliceManagementService.updateRank(officerId, newRank, promotedBy);
            res.status(200).json({
                success: true,
                message: "Officer rank updated successfully",
                data: result,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating officer rank:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Set station Officer-in-Charge (OC)
     */
    static async setStationOC(req, res) {
        try {
            const { stationId, officerId } = req.body;
            const appointedBy = req.user?.id;
            if (!appointedBy) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            if (!stationId || !officerId) {
                res.status(400).json({
                    success: false,
                    message: "Station ID and Officer ID are required",
                    statusCode: 400,
                });
                return;
            }
            const result = await policeManagement_service_1.PoliceManagementService.setStationOC(stationId, officerId, appointedBy);
            res.status(200).json({
                success: true,
                message: "Station OC set successfully",
                data: result,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error setting station OC:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Search police officers
     */
    static async searchOfficers(req, res) {
        try {
            const { name, badgeNo, rank, stationId } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await policeManagement_service_1.PoliceManagementService.searchOfficers({
                name: name,
                badgeNo: badgeNo,
                rank: rank,
                stationId: stationId,
                page,
                limit,
            });
            res.status(200).json({
                success: true,
                message: "Officers search completed successfully",
                data: result.officers,
                pagination: result.pagination,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error searching officers:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
    /**
     * Transfer police officer between stations
     */
    static async transferPoliceOfficer(req, res) {
        try {
            const { policeId } = req.params;
            const { newStationId, transferReason } = req.body;
            if (!policeId || !newStationId) {
                res.status(400).json({
                    success: false,
                    message: "Police ID and new station ID are required",
                    statusCode: 400,
                });
                return;
            }
            const transferBy = req.user?.id;
            if (!transferBy) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                    statusCode: 401,
                });
                return;
            }
            const transfer = await policeManagement_service_1.PoliceManagementService.transferOfficer(policeId, newStationId, transferBy, transferReason);
            res.status(200).json({
                success: true,
                message: "Police officer transferred successfully",
                data: transfer,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error transferring police officer:", error);
            if (error instanceof Error) {
                if (error.message === "Police officer not found" ||
                    error.message === "Station not found") {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                        statusCode: 404,
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
     * Get police statistics
     */
    static async getPoliceStatistics(req, res) {
        try {
            const statistics = await policeManagement_service_1.PoliceManagementService.getPoliceStatistics();
            res.status(200).json({
                success: true,
                message: "Police statistics retrieved successfully",
                data: statistics,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error getting police statistics:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                statusCode: 500,
            });
        }
    }
}
exports.PoliceManagementController = PoliceManagementController;
