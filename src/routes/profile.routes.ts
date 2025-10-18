import express from "express";
import {
  getUserProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  getUserStatistics,
  validateProfile,
  getUserDrivingLicenses,
  addDrivingLicense,
} from "../controllers/profile.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { updateUserActivity } from "../middleware/userActivity.middleware";

const router = express.Router();

// Apply activity tracking to all profile routes
router.use(authenticateToken, updateUserActivity);

/**
 * @route   GET /api/profile/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticateToken, getUserProfile);

/**
 * @route   GET /api/profile/statistics
 * @desc    Get user statistics for dashboard
 * @access  Private
 */
router.get("/statistics", authenticateToken, getUserStatistics);

/**
 * @route   GET /api/profile/validate
 * @desc    Validate profile completeness
 * @access  Private
 */
router.get("/validate", authenticateToken, validateProfile);

/**
 * @route   GET /api/profile/driving-licenses
 * @desc    Get user's driving licenses
 * @access  Private
 */
router.get("/driving-licenses", authenticateToken, getUserDrivingLicenses);

/**
 * @route   POST /api/profile/driving-licenses
 * @desc    Add driving license to user profile
 * @access  Private
 */
router.post("/driving-licenses", authenticateToken, addDrivingLicense);

/**
 * @route   PUT /api/profile/update
 * @desc    Update user profile
 * @access  Private
 */
router.put("/update", authenticateToken, updateProfile);

/**
 * @route   PUT /api/profile/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put("/change-password", authenticateToken, changePassword);

/**
 * @route   PUT /api/profile/upload-image
 * @desc    Upload profile image
 * @access  Private
 */
router.put("/upload-image", authenticateToken, uploadProfileImage);

export default router;
