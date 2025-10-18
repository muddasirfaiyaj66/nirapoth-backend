"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userProfile_controller_1 = require("../controllers/userProfile.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.authenticateToken);
/**
 * @route GET /api/profile
 * @desc Get user profile
 * @access Private
 */
router.get("/", userProfile_controller_1.UserProfileController.getProfile);
/**
 * @route GET /api/profile/me
 * @desc Get current user profile (alias for /)
 * @access Private
 */
router.get("/me", userProfile_controller_1.UserProfileController.getProfile);
/**
 * @route PUT /api/profile
 * @desc Update user profile
 * @access Private
 */
router.put("/", userProfile_controller_1.UserProfileController.updateProfile);
/**
 * @route PUT /api/profile/password
 * @desc Change password
 * @access Private
 */
router.put("/password", userProfile_controller_1.UserProfileController.changePassword);
/**
 * @route GET /api/profile/licenses
 * @desc Get user's driving licenses
 * @access Private
 */
router.get("/licenses", userProfile_controller_1.UserProfileController.getDrivingLicenses);
/**
 * @route POST /api/profile/licenses
 * @desc Add driving license
 * @access Private
 */
router.post("/licenses", userProfile_controller_1.UserProfileController.addDrivingLicense);
/**
 * @route GET /api/profile/statistics
 * @desc Get user statistics
 * @access Private
 */
router.get("/statistics", userProfile_controller_1.UserProfileController.getUserStatistics);
/**
 * @route POST /api/profile/upload-image
 * @desc Upload profile image
 * @access Private
 */
router.post("/upload-image", userProfile_controller_1.UserProfileController.uploadProfileImage);
/**
 * @route GET /api/profile/validate
 * @desc Validate profile completeness
 * @access Private
 */
router.get("/validate", userProfile_controller_1.UserProfileController.validateProfile);
/**
 * @route GET /api/profile/users/:role
 * @desc Get users by role (admin only)
 * @access Private (Admin only)
 */
router.get("/users/:role", userProfile_controller_1.UserProfileController.getUsersByRole);
exports.default = router;
