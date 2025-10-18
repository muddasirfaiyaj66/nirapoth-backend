"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vehicle_service_1 = __importDefault(require("../services/vehicle.service"));
class VehicleController {
    /**
     * Create a new vehicle (Citizen only)
     * POST /api/vehicles
     */
    async createVehicle(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const { type, plateNo, brand, model, year, color, engineNo, chassisNo, registrationNo, registrationDate, expiresAt, } = req.body;
            // Validation
            if (!type || !plateNo || !engineNo || !chassisNo) {
                res.status(400).json({
                    success: false,
                    message: "Missing required fields: type, plateNo, engineNo, chassisNo",
                });
                return;
            }
            const vehicle = await vehicle_service_1.default.createVehicle({
                type: type,
                plateNo,
                brand,
                model,
                year: year ? parseInt(year) : undefined,
                color,
                engineNo,
                chassisNo,
                registrationNo,
                registrationDate: registrationDate
                    ? new Date(registrationDate)
                    : undefined,
                ownerId: userId,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            });
            res.status(201).json({
                success: true,
                message: "Vehicle registered successfully",
                data: vehicle,
            });
        }
        catch (error) {
            console.error("❌ Error creating vehicle:", error);
            res.status(400).json({
                success: false,
                message: error.message || "Failed to create vehicle",
            });
        }
    }
    /**
     * Get all vehicles for current user
     * GET /api/vehicles/my-vehicles
     */
    async getMyVehicles(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const vehicles = await vehicle_service_1.default.getVehiclesByUserId(userId);
            res.status(200).json({
                success: true,
                data: vehicles,
            });
        }
        catch (error) {
            console.error("❌ Error fetching vehicles:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch vehicles",
            });
        }
    }
    /**
     * Get vehicle by ID
     * GET /api/vehicles/:id
     */
    async getVehicleById(req, res) {
        try {
            const { id } = req.params;
            const vehicle = await vehicle_service_1.default.getVehicleById(id);
            if (!vehicle) {
                res.status(404).json({
                    success: false,
                    message: "Vehicle not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: vehicle,
            });
        }
        catch (error) {
            console.error("❌ Error fetching vehicle:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch vehicle",
            });
        }
    }
    /**
     * Get vehicle by plate number (Admin/Police)
     * GET /api/vehicles/by-plate/:plateNo
     */
    async getVehicleByPlateNo(req, res) {
        try {
            const { plateNo } = req.params;
            const vehicle = await vehicle_service_1.default.getVehicleByPlateNo(plateNo);
            if (!vehicle) {
                res.status(404).json({
                    success: false,
                    message: "Vehicle not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: vehicle,
            });
        }
        catch (error) {
            console.error("❌ Error fetching vehicle:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch vehicle",
            });
        }
    }
    /**
     * Update vehicle information
     * PATCH /api/vehicles/:id
     */
    async updateVehicle(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const { type, brand, model, year, color, expiresAt, isActive } = req.body;
            const vehicle = await vehicle_service_1.default.updateVehicle(id, userId, {
                type,
                brand,
                model,
                year: year ? parseInt(year) : undefined,
                color,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                isActive,
            });
            res.status(200).json({
                success: true,
                message: "Vehicle updated successfully",
                data: vehicle,
            });
        }
        catch (error) {
            console.error("❌ Error updating vehicle:", error);
            res.status(400).json({
                success: false,
                message: error.message || "Failed to update vehicle",
            });
        }
    }
    /**
     * Delete vehicle (soft delete)
     * DELETE /api/vehicles/:id
     */
    async deleteVehicle(req, res) {
        try {
            const userId = req.user?.userId;
            const { id } = req.params;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            await vehicle_service_1.default.deleteVehicle(id, userId);
            res.status(200).json({
                success: true,
                message: "Vehicle deleted successfully",
            });
        }
        catch (error) {
            console.error("❌ Error deleting vehicle:", error);
            res.status(400).json({
                success: false,
                message: error.message || "Failed to delete vehicle",
            });
        }
    }
    /**
     * Get vehicle statistics
     * GET /api/vehicles/:id/stats
     */
    async getVehicleStats(req, res) {
        try {
            const { id } = req.params;
            const stats = await vehicle_service_1.default.getVehicleStats(id);
            res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error("❌ Error fetching vehicle stats:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch vehicle statistics",
            });
        }
    }
    /**
     * Search vehicles (Admin/Police)
     * GET /api/vehicles/search?q=plateNo
     */
    async searchVehicles(req, res) {
        try {
            const userRole = req.user?.role;
            if (userRole !== "POLICE" &&
                userRole !== "ADMIN" &&
                userRole !== "SUPER_ADMIN") {
                res.status(403).json({
                    success: false,
                    message: "Unauthorized",
                });
                return;
            }
            const { q, limit } = req.query;
            if (!q) {
                res.status(400).json({
                    success: false,
                    message: "Search query is required",
                });
                return;
            }
            const vehicles = await vehicle_service_1.default.searchVehicles(q, limit ? parseInt(limit) : 10);
            res.status(200).json({
                success: true,
                data: vehicles,
            });
        }
        catch (error) {
            console.error("❌ Error searching vehicles:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to search vehicles",
            });
        }
    }
}
exports.default = new VehicleController();
