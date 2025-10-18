import { Router } from "express";
import drivingLicenseRoutes from "./drivingLicense.routes";
import vehicleAssignmentRoutes from "./vehicleAssignment.routes";
import userProfileRoutes from "./userProfile.routes";
import policeManagementRoutes from "./policeManagement.routes";
import vehicleRoutes from "./vehicle.routes";
import cameraRoutes from "./camera.routes";
import rewardsRoutes from "./rewards.routes";
const router = Router();
// API Routes
router.use("/driving-license", drivingLicenseRoutes);
router.use("/vehicle-assignment", vehicleAssignmentRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/profile", userProfileRoutes);
router.use("/police", policeManagementRoutes);
router.use("/cameras", cameraRoutes);
router.use("/rewards", rewardsRoutes);
export default router;
