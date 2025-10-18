"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const userActivity_middleware_1 = require("../middleware/userActivity.middleware");
const router = (0, express_1.Router)();
// Apply activity tracking to all profile routes
router.use(auth_middleware_1.authenticateToken, userActivity_middleware_1.updateUserActivity);
/**
 * @route   GET /api/profile/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", auth_middleware_1.authenticateToken, profile_controller_1.getUserProfile);
/**
 * @route   GET /api/profile/statistics
 * @desc    Get user statistics for dashboard
 * @access  Private
 */
router.get("/statistics", auth_middleware_1.authenticateToken, profile_controller_1.getUserStatistics);
/**
 * @route   GET /api/profile/validate
 * @desc    Validate profile completeness
 * @access  Private
 */
router.get("/validate", auth_middleware_1.authenticateToken, profile_controller_1.validateProfile);
/**
 * @route   GET /api/profile/driving-licenses
 * @desc    Get user's driving licenses
 * @access  Private
 */
router.get("/driving-licenses", auth_middleware_1.authenticateToken, profile_controller_1.getUserDrivingLicenses);
/**
 * @route   POST /api/profile/driving-licenses
 * @desc    Add driving license to user profile
 * @access  Private
 */
router.post("/driving-licenses", auth_middleware_1.authenticateToken, profile_controller_1.addDrivingLicense);
/**
 * @route   PUT /api/profile/update
 * @desc    Update user profile
 * @access  Private
 */
router.put("/update", auth_middleware_1.authenticateToken, profile_controller_1.updateProfile);
/**
 * @route   PUT /api/profile/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put("/change-password", auth_middleware_1.authenticateToken, profile_controller_1.changePassword);
/**
 * @route   PUT /api/profile/upload-image
 * @desc    Upload profile image
 * @access  Private
 */
router.put("/upload-image", auth_middleware_1.authenticateToken, profile_controller_1.uploadProfileImage);
exports.default = router;
