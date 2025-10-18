"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationRateLimiterMiddleware = exports.passwordResetRateLimiterMiddleware = exports.authRateLimiterMiddleware = exports.rateLimiter = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const env_1 = require("../config/env");
// Memory-based rate limiter (for development)
const rateLimiterMemory = new rate_limiter_flexible_1.RateLimiterMemory({
    keyPrefix: "middleware",
    points: env_1.config.rateLimit.maxRequests,
    duration: env_1.config.rateLimit.windowMs / 1000, // Convert to seconds
});
/**
 * General rate limiting middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const rateLimiter = async (req, res, next) => {
    // Skip CORS preflight
    if (req.method === "OPTIONS") {
        return next();
    }
    try {
        const key = req.ip || "unknown";
        await rateLimiterMemory.consume(key);
        next();
    }
    catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set("Retry-After", String(secs));
        res.status(429).json({
            success: false,
            message: "Too many requests, please try again later",
            retryAfter: secs,
            statusCode: 429,
        });
    }
};
exports.rateLimiter = rateLimiter;
/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    keyPrefix: "auth",
    points: 50000, // 50000 attempts
    duration: 900, // 15 minutes
    blockDuration: 900, // Block for 15 minutes after limit exceeded
});
/**
 * Rate limiting middleware for authentication endpoints
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const authRateLimiterMiddleware = async (req, res, next) => {
    try {
        const key = req.ip || "unknown";
        await authRateLimiter.consume(key);
        next();
    }
    catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set("Retry-After", String(secs));
        res.status(429).json({
            success: false,
            message: "Too many authentication attempts, please try again later",
            retryAfter: secs,
            statusCode: 429,
        });
    }
};
exports.authRateLimiterMiddleware = authRateLimiterMiddleware;
/**
 * Password reset rate limiter
 */
const passwordResetRateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    keyPrefix: "password_reset",
    points: 3, // 3 attempts
    duration: 3600, // 1 hour
    blockDuration: 3600, // Block for 1 hour after limit exceeded
});
/**
 * Rate limiting middleware for password reset endpoints
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const passwordResetRateLimiterMiddleware = async (req, res, next) => {
    try {
        const key = req.ip || "unknown";
        await passwordResetRateLimiter.consume(key);
        next();
    }
    catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set("Retry-After", String(secs));
        res.status(429).json({
            success: false,
            message: "Too many password reset attempts, please try again later",
            retryAfter: secs,
            statusCode: 429,
        });
    }
};
exports.passwordResetRateLimiterMiddleware = passwordResetRateLimiterMiddleware;
/**
 * Registration rate limiter
 */
const registrationRateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    keyPrefix: "registration",
    points: 13, // 3 attempts
    duration: 3600, // 1 hour
    blockDuration: 3600, // Block for 1 hour after limit exceeded
});
/**
 * Rate limiting middleware for registration endpoint
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const registrationRateLimiterMiddleware = async (req, res, next) => {
    try {
        const key = req.ip || "unknown";
        await registrationRateLimiter.consume(key);
        next();
    }
    catch (rejRes) {
        const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set("Retry-After", String(secs));
        res.status(429).json({
            success: false,
            message: "Too many registration attempts, please try again later",
            retryAfter: secs,
            statusCode: 429,
        });
    }
};
exports.registrationRateLimiterMiddleware = registrationRateLimiterMiddleware;
