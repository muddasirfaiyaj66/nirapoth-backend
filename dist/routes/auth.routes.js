import { Router } from "express";
import { register, login, logout, refreshToken, getCurrentUser, verifyEmail, forgotPassword, resetPassword, } from "../controllers/auth.controller";
import { authRateLimiterMiddleware, registrationRateLimiterMiddleware, passwordResetRateLimiterMiddleware, } from "../middlewares/rateLimit.middleware";
import { authenticateToken } from "../middlewares/auth.middleware";
const router = Router();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @rateLimit 3 attempts per hour per IP
 */
router.post("/register", registrationRateLimiterMiddleware, register);
/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @rateLimit 5 attempts per 15 minutes per IP
 */
router.post("/login", authRateLimiterMiddleware, login);
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", logout);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (but requires valid refresh token in cookie)
 */
router.post("/refresh", refreshToken);
/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", authenticateToken, getCurrentUser);
/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
router.get("/verify-email", verifyEmail);
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 * @rateLimit 3 attempts per hour per IP
 */
router.post("/forgot-password", passwordResetRateLimiterMiddleware, forgotPassword);
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password", resetPassword);
export default router;
