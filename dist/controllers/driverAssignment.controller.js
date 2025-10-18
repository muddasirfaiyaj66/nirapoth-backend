import { DriverAssignmentService } from "../services/driverAssignment.service";
import { NotificationService } from "../services/notification.service";
export const createAssignment = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const assignment = await DriverAssignmentService.createAssignment({
            ...req.body,
            ownerId,
        });
        // Send notification to driver
        const ownerName = `${assignment.owner.firstName} ${assignment.owner.lastName}`;
        await NotificationService.notifyVehicleAssignmentCreated(assignment.driverId, ownerName, assignment.vehicle.plateNo, assignment.id).catch((err) => console.error("Failed to send notification:", err));
        res.status(201).json({
            success: true,
            message: "Driver assignment created successfully",
            data: assignment,
        });
    }
    catch (error) {
        console.error("Error creating assignment:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to create assignment",
        });
    }
};
export const acceptAssignment = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const assignment = await DriverAssignmentService.acceptAssignment(id, userId);
        // Send notification to owner
        const driverName = `${assignment.driver.firstName} ${assignment.driver.lastName}`;
        await NotificationService.notifyAssignmentAccepted(assignment.ownerId, driverName, assignment.vehicle.plateNo, assignment.id).catch((err) => console.error("Failed to send notification:", err));
        res.status(200).json({
            success: true,
            message: "Assignment accepted successfully",
            data: assignment,
        });
    }
    catch (error) {
        console.error("Error accepting assignment:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to accept assignment",
        });
    }
};
export const rejectAssignment = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const assignment = await DriverAssignmentService.rejectAssignment(id, userId);
        // Send notification to owner
        const driverName = `${assignment.driver.firstName} ${assignment.driver.lastName}`;
        await NotificationService.notifyAssignmentRejected(assignment.ownerId, driverName, assignment.vehicle.plateNo).catch((err) => console.error("Failed to send notification:", err));
        res.status(200).json({
            success: true,
            message: "Assignment rejected successfully",
            data: assignment,
        });
    }
    catch (error) {
        console.error("Error rejecting assignment:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to reject assignment",
        });
    }
};
export const resignFromAssignment = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const assignment = await DriverAssignmentService.resignFromAssignment(id, userId);
        // Send notification to owner
        const driverName = `${assignment.driver.firstName} ${assignment.driver.lastName}`;
        await NotificationService.notifyDriverResigned(assignment.ownerId, driverName, assignment.vehicle.plateNo, assignment.id).catch((err) => console.error("Failed to send notification:", err));
        res.status(200).json({
            success: true,
            message: "Resigned from assignment successfully",
            data: assignment,
        });
    }
    catch (error) {
        console.error("Error resigning from assignment:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to resign from assignment",
        });
    }
};
export const terminateAssignment = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const assignment = await DriverAssignmentService.terminateAssignment(id, userId);
        // Send notification to driver
        const ownerName = `${assignment.owner.firstName} ${assignment.owner.lastName}`;
        await NotificationService.notifyAssignmentTerminated(assignment.driverId, ownerName, assignment.vehicle.plateNo).catch((err) => console.error("Failed to send notification:", err));
        res.status(200).json({
            success: true,
            message: "Assignment terminated successfully",
            data: assignment,
        });
    }
    catch (error) {
        console.error("Error terminating assignment:", error);
        res.status(400).json({
            success: false,
            message: error.message || "Failed to terminate assignment",
        });
    }
};
export const getMyAssignments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const assignments = await DriverAssignmentService.getMyAssignments(userId);
        res.status(200).json({
            success: true,
            data: assignments,
        });
    }
    catch (error) {
        console.error("Error getting assignments:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to get assignments",
        });
    }
};
export const getAssignment = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { id } = req.params;
        const assignment = await DriverAssignmentService.getAssignment(id, userId);
        res.status(200).json({
            success: true,
            data: assignment,
        });
    }
    catch (error) {
        console.error("Error getting assignment:", error);
        res
            .status(error.message === "Unauthorized access to this assignment" ? 403 : 404)
            .json({
            success: false,
            message: error.message || "Failed to get assignment",
        });
    }
};
export const getVehicleAssignments = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const { vehicleId } = req.params;
        const assignments = await DriverAssignmentService.getVehicleAssignments(vehicleId, userId);
        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments,
        });
    }
    catch (error) {
        console.error("Error getting vehicle assignments:", error);
        res
            .status(error.message === "Unauthorized access to vehicle assignments"
            ? 403
            : 404)
            .json({
            success: false,
            message: error.message || "Failed to get vehicle assignments",
        });
    }
};
export const getDriverAssignments = async (req, res) => {
    try {
        const { driverId } = req.params;
        const assignments = await DriverAssignmentService.getDriverAssignments(driverId);
        res.status(200).json({
            success: true,
            count: assignments.length,
            data: assignments,
        });
    }
    catch (error) {
        console.error("Error getting driver assignments:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to get driver assignments",
        });
    }
};
