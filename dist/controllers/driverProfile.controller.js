"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDriverProfile = exports.updateDriverStatus = exports.searchDrivers = exports.getMyDriverProfile = exports.getDriverProfileByUser = exports.getDriverProfile = exports.updateDriverProfile = exports.createDriverProfile = void 0;
const driverProfile_service_1 = require("../services/driverProfile.service");
const notification_service_1 = require("../services/notification.service");
const client_1 = require("@prisma/client");
const createDriverProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const profile = await driverProfile_service_1.DriverProfileService.createDriverProfile({
            userId,
            ...req.body,
        });
        // Send notification
        await notification_service_1.NotificationService.notifyDriverProfileCreated(userId).catch((err) => console.error("Failed to send notification:", err));
        res.status(201).json({
            success: true,
            message: "Driver profile created successfully",
            data: profile,
        });
    }
    catch (error) {
        console.error("Error creating driver profile:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to create driver profile",
        });
    }
};
exports.createDriverProfile = createDriverProfile;
const updateDriverProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const profile = await driverProfile_service_1.DriverProfileService.updateDriverProfile(id, userId, req.body);
        res.status(200).json({
            success: true,
            message: "Driver profile updated successfully",
            data: profile,
        });
    }
    catch (error) {
        console.error("Error updating driver profile:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update driver profile",
        });
    }
};
exports.updateDriverProfile = updateDriverProfile;
const getDriverProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await driverProfile_service_1.DriverProfileService.getDriverProfileById(id);
        res.status(200).json({
            success: true,
            data: profile,
        });
    }
    catch (error) {
        console.error("Error getting driver profile:", error);
        res.status(404).json({
            success: false,
            message: error.message || "Driver profile not found",
        });
    }
};
exports.getDriverProfile = getDriverProfile;
const getDriverProfileByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await driverProfile_service_1.DriverProfileService.getDriverProfileByUserId(userId);
        if (!profile) {
            res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: profile,
        });
    }
    catch (error) {
        console.error("Error getting driver profile by user:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to get driver profile",
        });
    }
};
exports.getDriverProfileByUser = getDriverProfileByUser;
const getMyDriverProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const profile = await driverProfile_service_1.DriverProfileService.getDriverProfileByUserId(userId);
        if (!profile) {
            res.status(404).json({
                success: false,
                message: "Driver profile not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: profile,
        });
    }
    catch (error) {
        console.error("Error getting my driver profile:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to get driver profile",
        });
    }
};
exports.getMyDriverProfile = getMyDriverProfile;
const searchDrivers = async (req, res) => {
    try {
        const filters = {
            location: req.query.location,
            minSalary: req.query.minSalary
                ? parseInt(req.query.minSalary)
                : undefined,
            maxSalary: req.query.maxSalary
                ? parseInt(req.query.maxSalary)
                : undefined,
            minExperience: req.query.minExperience
                ? parseInt(req.query.minExperience)
                : undefined,
            availability: req.query.availability,
            minGems: req.query.minGems
                ? parseInt(req.query.minGems)
                : undefined,
        };
        const drivers = await driverProfile_service_1.DriverProfileService.searchDrivers(filters);
        res.status(200).json({
            success: true,
            count: drivers.length,
            data: drivers,
        });
    }
    catch (error) {
        console.error("Error searching drivers:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to search drivers",
        });
    }
};
exports.searchDrivers = searchDrivers;
const updateDriverStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!Object.values(client_1.DriverStatus).includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid driver status",
            });
            return;
        }
        const profile = await driverProfile_service_1.DriverProfileService.updateDriverStatus(id, userId, status);
        res.status(200).json({
            success: true,
            message: "Driver status updated successfully",
            data: profile,
        });
    }
    catch (error) {
        console.error("Error updating driver status:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update driver status",
        });
    }
};
exports.updateDriverStatus = updateDriverStatus;
const deleteDriverProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        await driverProfile_service_1.DriverProfileService.deleteDriverProfile(id, userId);
        res.status(200).json({
            success: true,
            message: "Driver profile deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting driver profile:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to delete driver profile",
        });
    }
};
exports.deleteDriverProfile = deleteDriverProfile;
