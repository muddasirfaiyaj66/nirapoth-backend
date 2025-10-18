"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CameraController {
    /**
     * Get all cameras with optional filtering
     */
    static async getCameras(req, res) {
        try {
            const { status, locationId, stationId, search } = req.query;
            const where = {};
            // Apply filters
            if (status) {
                where.status = status;
            }
            if (locationId) {
                where.locationId = locationId;
            }
            if (stationId) {
                where.stationId = stationId;
            }
            if (search) {
                where.OR = [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive",
                        },
                    },
                    {
                        location: {
                            address: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    },
                    {
                        station: {
                            name: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    },
                ];
            }
            const cameras = await prisma.camera.findMany({
                where,
                include: {
                    location: true,
                    station: true,
                    fireService: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            res.status(200).json({
                success: true,
                message: "Cameras retrieved successfully",
                data: cameras,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching cameras:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get a single camera by ID
     */
    static async getCameraById(req, res) {
        try {
            const { id } = req.params;
            const camera = await prisma.camera.findUnique({
                where: { id },
                include: {
                    location: true,
                    station: true,
                    fireService: true,
                },
            });
            if (!camera) {
                res.status(404).json({
                    success: false,
                    message: "Camera not found",
                    statusCode: 404,
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Camera retrieved successfully",
                data: camera,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching camera:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Create a new camera
     */
    static async createCamera(req, res) {
        try {
            const { name, streamUrl, status, locationId, stationId, fireServiceId } = req.body;
            // Validate required fields
            if (!streamUrl) {
                res.status(400).json({
                    success: false,
                    message: "Stream URL is required",
                    statusCode: 400,
                });
                return;
            }
            // Check if stream URL is already in use
            const existingCamera = await prisma.camera.findFirst({
                where: { streamUrl },
            });
            if (existingCamera) {
                res.status(409).json({
                    success: false,
                    message: "Stream URL is already in use",
                    statusCode: 409,
                });
                return;
            }
            const camera = await prisma.camera.create({
                data: {
                    name,
                    streamUrl,
                    status: status || "ACTIVE",
                    locationId: locationId || null,
                    stationId: stationId || null,
                    fireServiceId: fireServiceId || null,
                    installedAt: new Date(),
                },
                include: {
                    location: true,
                    station: true,
                    fireService: true,
                },
            });
            res.status(201).json({
                success: true,
                message: "Camera created successfully",
                data: camera,
                statusCode: 201,
            });
        }
        catch (error) {
            console.error("Error creating camera:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Update an existing camera
     */
    static async updateCamera(req, res) {
        try {
            const { id } = req.params;
            const { name, streamUrl, status, locationId, stationId, fireServiceId } = req.body;
            // Check if camera exists
            const existingCamera = await prisma.camera.findUnique({
                where: { id },
            });
            if (!existingCamera) {
                res.status(404).json({
                    success: false,
                    message: "Camera not found",
                    statusCode: 404,
                });
                return;
            }
            // Check if stream URL is already in use by another camera
            if (streamUrl && streamUrl !== existingCamera.streamUrl) {
                const duplicateCamera = await prisma.camera.findFirst({
                    where: {
                        streamUrl,
                        id: { not: id },
                    },
                });
                if (duplicateCamera) {
                    res.status(409).json({
                        success: false,
                        message: "Stream URL is already in use by another camera",
                        statusCode: 409,
                    });
                    return;
                }
            }
            const camera = await prisma.camera.update({
                where: { id },
                data: {
                    name,
                    streamUrl,
                    status,
                    locationId: locationId || null,
                    stationId: stationId || null,
                    fireServiceId: fireServiceId || null,
                },
                include: {
                    location: true,
                    station: true,
                    fireService: true,
                },
            });
            res.status(200).json({
                success: true,
                message: "Camera updated successfully",
                data: camera,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating camera:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Delete a camera
     */
    static async deleteCamera(req, res) {
        try {
            const { id } = req.params;
            // Check if camera exists
            const existingCamera = await prisma.camera.findUnique({
                where: { id },
            });
            if (!existingCamera) {
                res.status(404).json({
                    success: false,
                    message: "Camera not found",
                    statusCode: 404,
                });
                return;
            }
            await prisma.camera.delete({
                where: { id },
            });
            res.status(200).json({
                success: true,
                message: "Camera deleted successfully",
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error deleting camera:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get camera statistics
     */
    static async getCameraStats(req, res) {
        try {
            const [total, active, inactive, maintenance, offline] = await Promise.all([
                prisma.camera.count(),
                prisma.camera.count({ where: { status: "ACTIVE" } }),
                prisma.camera.count({ where: { status: "INACTIVE" } }),
                prisma.camera.count({ where: { status: "MAINTENANCE" } }),
                prisma.camera.count({ where: { status: "OFFLINE" } }),
            ]);
            const stats = {
                total,
                active,
                inactive,
                maintenance,
                offline,
                operationalRate: total > 0 ? ((active / total) * 100).toFixed(1) : "0",
            };
            res.status(200).json({
                success: true,
                message: "Camera statistics retrieved successfully",
                data: stats,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching camera stats:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Update camera status
     */
    static async updateCameraStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!["ACTIVE", "INACTIVE", "MAINTENANCE", "OFFLINE"].includes(status)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid status. Must be ACTIVE, INACTIVE, MAINTENANCE, or OFFLINE",
                    statusCode: 400,
                });
                return;
            }
            const camera = await prisma.camera.update({
                where: { id },
                data: { status },
                include: {
                    location: true,
                    station: true,
                    fireService: true,
                },
            });
            res.status(200).json({
                success: true,
                message: "Camera status updated successfully",
                data: camera,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error updating camera status:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get locations for dropdown
     */
    static async getLocations(req, res) {
        try {
            const locations = await prisma.location.findMany({
                select: {
                    id: true,
                    address: true,
                    city: true,
                    district: true,
                    latitude: true,
                    longitude: true,
                },
                orderBy: {
                    city: "asc",
                },
            });
            res.status(200).json({
                success: true,
                message: "Locations retrieved successfully",
                data: locations,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching locations:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
    /**
     * Get police stations for dropdown
     */
    static async getPoliceStations(req, res) {
        try {
            const stations = await prisma.policeStation.findMany({
                select: {
                    id: true,
                    name: true,
                },
                orderBy: {
                    name: "asc",
                },
            });
            res.status(200).json({
                success: true,
                message: "Police stations retrieved successfully",
                data: stations,
                statusCode: 200,
            });
        }
        catch (error) {
            console.error("Error fetching police stations:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                statusCode: 500,
            });
        }
    }
}
exports.CameraController = CameraController;
