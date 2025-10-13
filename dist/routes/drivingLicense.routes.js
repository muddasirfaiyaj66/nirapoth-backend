import { Router } from "express";
import { DrivingLicenseController } from "../controllers/drivingLicense.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
const router = Router();
// All routes require authentication
router.use(authenticateToken);
/**
 * @route GET /api/driving-license
 * @desc Get user's driving licenses
 * @access Private
 */
router.get("/", DrivingLicenseController.getUserLicenses);
/**
 * @route POST /api/driving-license
 * @desc Add new driving license
 * @access Private
 */
router.post("/", DrivingLicenseController.addLicense);
/**
 * @route PUT /api/driving-license/:licenseId
 * @desc Update driving license
 * @access Private
 */
router.put("/:licenseId", DrivingLicenseController.updateLicense);
/**
 * @route GET /api/driving-license/:licenseId/validate
 * @desc Validate license for vehicle assignment
 * @access Private
 */
router.get("/:licenseId/validate", DrivingLicenseController.validateLicense);
/**
 * @route POST /api/driving-license/:licenseId/violation
 * @desc Record traffic violation
 * @access Private (Police only)
 */
router.post("/:licenseId/violation", DrivingLicenseController.recordViolation);
/**
 * @route PUT /api/driving-license/:licenseId/suspend
 * @desc Suspend driving license
 * @access Private (Police/Admin only)
 */
router.put("/:licenseId/suspend", DrivingLicenseController.suspendLicense);
/**
 * @route PUT /api/driving-license/:licenseId/reinstate
 * @desc Reinstate suspended license
 * @access Private (Police/Admin only)
 */
router.put("/:licenseId/reinstate", DrivingLicenseController.reinstateLicense);
/**
 * @route GET /api/driving-license/expiring
 * @desc Get licenses expiring soon
 * @access Private
 */
router.get("/expiring", DrivingLicenseController.getExpiringLicenses);
/**
 * @route GET /api/driving-license/verify/:licenseNo
 * @desc Verify license by license number
 * @access Private (Police only)
 */
router.get("/verify/:licenseNo", DrivingLicenseController.verifyLicenseByNumber);
export default router;
