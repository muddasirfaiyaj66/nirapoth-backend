import { Router } from "express";
import { updateProfile, changePassword, uploadProfileImage, } from "../controllers/profile.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
const router = Router();
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
