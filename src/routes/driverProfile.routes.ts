import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as driverProfileController from "../controllers/driverProfile.controller";

const router = express.Router();

// Create/Update driver profile
router.post(
  "/create",
  authenticate,
  driverProfileController.createDriverProfile
);
router.put("/:id", authenticate, driverProfileController.updateDriverProfile);
router.delete(
  "/:id",
  authenticate,
  driverProfileController.deleteDriverProfile
);

// Get driver profiles
// IMPORTANT: Specific routes MUST come before parameterized routes
router.get(
  "/my-profile",
  authenticate,
  driverProfileController.getMyDriverProfile
);
router.get("/search", driverProfileController.searchDrivers); // Public with filters
router.get("/user/:userId", driverProfileController.getDriverProfileByUser);
router.get("/:id", driverProfileController.getDriverProfile);

// Status management
router.patch(
  "/:id/status",
  authenticate,
  driverProfileController.updateDriverStatus
);

export default router;
