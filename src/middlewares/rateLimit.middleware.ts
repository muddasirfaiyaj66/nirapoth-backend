import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { config } from "../config/env";

// Memory-based rate limiter (for development)
const rateLimiterMemory = new RateLimiterMemory({
  keyPrefix: "middleware",
  points: config.rateLimit.maxRequests,
  duration: config.rateLimit.windowMs / 1000, // Convert to seconds
});

/**
 * General rate limiting middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = req.ip || "unknown";
    await rateLimiterMemory.consume(key);
    next();
  } catch (rejRes: any) {
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

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = new RateLimiterMemory({
  keyPrefix: "auth",
  points: 5, // 5 attempts
  duration: 900, // 15 minutes
  blockDuration: 900, // Block for 15 minutes after limit exceeded
});

/**
 * Rate limiting middleware for authentication endpoints
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = req.ip || "unknown";
    await authRateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
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

/**
 * Password reset rate limiter
 */
const passwordResetRateLimiter = new RateLimiterMemory({
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
export const passwordResetRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = req.ip || "unknown";
    await passwordResetRateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
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

/**
 * Registration rate limiter
 */
const registrationRateLimiter = new RateLimiterMemory({
  keyPrefix: "registration",
  points: 3, // 3 attempts
  duration: 3600, // 1 hour
  blockDuration: 3600, // Block for 1 hour after limit exceeded
});

/**
 * Rate limiting middleware for registration endpoint
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const registrationRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const key = req.ip || "unknown";
    await registrationRateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
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
