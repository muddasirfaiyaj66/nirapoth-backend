import { Router } from "express";
import { UserProfileController } from "../controllers/userProfile.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/profile
 * @desc Get user profile
 * @access Private
 */
router.get("/", UserProfileController.getProfile);

/**
 * @route GET /api/profile/me
 * @desc Get current user profile (alias for /)
 * @access Private
 */
router.get("/me", UserProfileController.getProfile);

/**
 * @route PUT /api/profile
 * @desc Update user profile
 * @access Private
 */
router.put("/", UserProfileController.updateProfile);

/**
 * @route PUT /api/profile/password
 * @desc Change password
 * @access Private
 */
router.put("/password", UserProfileController.changePassword);

/**
 * @route GET /api/profile/licenses
 * @desc Get user's driving licenses
 * @access Private
 */
router.get("/licenses", UserProfileController.getDrivingLicenses);

/**
 * @route POST /api/profile/licenses
 * @desc Add driving license
 * @access Private
 */
router.post("/licenses", UserProfileController.addDrivingLicense);

/**
 * @route GET /api/profile/statistics
 * @desc Get user statistics
 * @access Private
 */
router.get("/statistics", UserProfileController.getUserStatistics);

/**
 * @route POST /api/profile/upload-image
 * @desc Upload profile image
 * @access Private
 */
router.post("/upload-image", UserProfileController.uploadProfileImage);

/**
 * @route GET /api/profile/validate
 * @desc Validate profile completeness
 * @access Private
 */
router.get("/validate", UserProfileController.validateProfile);

/**
 * @route GET /api/profile/users/:role
 * @desc Get users by role (admin only)
 * @access Private (Admin only)
 */
router.get("/users/:role", UserProfileController.getUsersByRole);

export default router;
