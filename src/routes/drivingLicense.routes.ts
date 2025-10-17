import { Router } from "express";
import DrivingLicenseController from "../controllers/drivingLicense.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Citizen routes
router.post("/", DrivingLicenseController.createLicense);
router.get("/my-license", DrivingLicenseController.getMyLicense);
router.patch("/:id", DrivingLicenseController.updateLicense);
router.post(
  "/:id/pay-blacklist-penalty",
  DrivingLicenseController.payBlacklistPenalty
);

// Admin/Police routes
router.get("/blacklisted", DrivingLicenseController.getBlacklistedLicenses);
router.get(
  "/by-license-no/:licenseNo",
  DrivingLicenseController.getLicenseByLicenseNo
);
router.get("/:id", DrivingLicenseController.getLicenseById);
router.get("/:id/validity", DrivingLicenseController.checkValidity);

// Police only routes
router.post("/:id/deduct-gems", DrivingLicenseController.deductGems);

export default router;
