import { Response, NextFunction } from "express";
import { JWTService } from "../services/jwt.service";
import { AuthRequest } from "../types/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Authentication middleware to verify JWT tokens
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookies
    let token: string | undefined;

    // Check Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // If no token in header, check cookies
    if (!token && req.cookies) {
      token = req.cookies.accessToken;
    }

    // Debug logging - always log in development to diagnose issue
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Auth Debug:", {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!authHeader,
        authHeaderValue: authHeader
          ? authHeader.substring(0, 20) + "..."
          : "none",
        hasCookies: !!req.cookies,
        cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
        accessTokenPresent: req.cookies?.accessToken ? "YES" : "NO",
        refreshTokenPresent: req.cookies?.refreshToken ? "YES" : "NO",
        tokenFound: !!token,
      });
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
        statusCode: 401,
      });
      return;
    }

    // Verify the token
    let decoded;
    try {
      decoded = JWTService.verifyAccessToken(token);
      if (process.env.NODE_ENV === "development") {
        console.log(
          "🔍 Token verified successfully for userId:",
          decoded.userId
        );
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 Token verification failed:", error.message);
      }
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        statusCode: 401,
      });
      return;
    }

    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        stationId: true,
        nidNo: true,
        birthCertificateNo: true,
        profileImage: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 User lookup result:", user ? "FOUND" : "NOT FOUND");
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found or token is invalid",
        statusCode: 401,
      });
      return;
    }

    // Attach user information to request object
    req.user = {
      ...user,
      userId: user.id, // Add userId alias for backward compatibility
    } as any;
    req.userId = user.id;
    req.userRole = user.role;

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Auth successful, calling next()");
    }

    next();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Auth middleware error:", {
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    res.status(401).json({
      success: false,
      message,
      statusCode: 401,
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token is provided
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookies
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies) {
      token = req.cookies.accessToken;
    }

    if (token) {
      // Try to verify the token
      const decoded = JWTService.verifyAccessToken(token);

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          stationId: true,
          nidNo: true,
          birthCertificateNo: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
          isDeleted: true,
          isBlocked: true,
        },
      });

      if (user) {
        req.user = user as any;
        req.userId = user.id;
        req.userRole = user.role;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Middleware function
 */
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        statusCode: 401,
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        statusCode: 403,
      });
      return;
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = authorizeRoles(["ADMIN"]);

/**
 * Police or Admin middleware
 */
export const policeOrAdmin = authorizeRoles(["ADMIN", "POLICE"]);

/**
 * Fire Service or Admin middleware
 */
export const fireServiceOrAdmin = authorizeRoles(["ADMIN", "FIRE_SERVICE"]);

/**
 * Alias for authenticateToken for backward compatibility
 */
export const authenticate = authenticateToken;
