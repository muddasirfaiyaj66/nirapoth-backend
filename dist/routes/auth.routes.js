"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const rateLimit_middleware_1 = require("../middlewares/rateLimit.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @rateLimit 3 attempts per hour per IP
 */
router.post("/register", rateLimit_middleware_1.registrationRateLimiterMiddleware, auth_controller_1.register);
/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @rateLimit 5 attempts per 15 minutes per IP
 */
router.post("/login", rateLimit_middleware_1.authRateLimiterMiddleware, auth_controller_1.login);
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", auth_controller_1.logout);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (but requires valid refresh token in cookie)
 */
router.post("/refresh", auth_controller_1.refreshToken);
/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", auth_middleware_1.authenticateToken, auth_controller_1.getCurrentUser);
/**
 * @route   GET /api/auth/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
router.get("/verify-email", auth_controller_1.verifyEmail);
/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 * @rateLimit 3 attempts per hour per IP
 */
router.post("/resend-verification", rateLimit_middleware_1.passwordResetRateLimiterMiddleware, auth_controller_1.resendVerificationEmail);
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 * @rateLimit 3 attempts per hour per IP
 */
router.post("/forgot-password", rateLimit_middleware_1.passwordResetRateLimiterMiddleware, auth_controller_1.forgotPassword);
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password", auth_controller_1.resetPassword);
exports.default = router;
