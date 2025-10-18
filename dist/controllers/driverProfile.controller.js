import { DriverProfileService } from "../services/driverProfile.service";
import { NotificationService } from "../services/notification.service";
import { DriverStatus } from "@prisma/client";
export const createDriverProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const profile = await DriverProfileService.createDriverProfile({
            userId,
            ...req.body,
        });
        // Send notification
        await NotificationService.notifyDriverProfileCreated(userId).catch((err) => console.error("Failed to send notification:", err));
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
export const updateDriverProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const profile = await DriverProfileService.updateDriverProfile(id, userId, req.body);
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
export const getDriverProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await DriverProfileService.getDriverProfileById(id);
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
export const getDriverProfileByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const profile = await DriverProfileService.getDriverProfileByUserId(userId);
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
export const getMyDriverProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const profile = await DriverProfileService.getDriverProfileByUserId(userId);
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
export const searchDrivers = async (req, res) => {
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
        const drivers = await DriverProfileService.searchDrivers(filters);
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
export const updateDriverStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!Object.values(DriverStatus).includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid driver status",
            });
            return;
        }
        const profile = await DriverProfileService.updateDriverStatus(id, userId, status);
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
export const deleteDriverProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        await DriverProfileService.deleteDriverProfile(id, userId);
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
